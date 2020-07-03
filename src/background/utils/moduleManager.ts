import { maxSatisfying, rcompare } from 'semver';
import { DEFAULT_BRANCH_NAME, ModuleTypes } from '../../common/constants';
import Manifest from '../models/manifest';
import { addEvent } from '../services/eventService';
import { RegistryAggregator } from '../registries/registryAggregator';
import { StorageAggregator } from '../moduleStorages/moduleStorage';
import { areModulesEqual } from '../../common/helpers';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';
import { StorageRef } from '../registries/registry';
import GlobalConfigService from '../services/globalConfigService';

export default class ModuleManager {

    public registryAggregator = new RegistryAggregator();
    private _storage = new StorageAggregator();
    private _globalConfigService = new GlobalConfigService();

    public async resolveDependencies(modules: { name: string, version: string, branch?: string, contextIds: string[] }[]) {
        // ToDo: Add dependency optimizer
        // Search for the following topics: 
        // 1. Topological Sorting
        // 2. Dependency Resolution Algorithm

        let dependencies: { name: string, branch: string, version: string, contextIds: string[], manifest: VersionInfo }[] =
            modules.map(({ name, version, branch, contextIds }) => ({ name, version, branch: !branch ? DEFAULT_BRANCH_NAME : branch, contextIds, manifest: null }));

        const resolve = async (parent: { name: string, branch: string, version: string, contextIds: string[], manifest: VersionInfo }) => {
            try {
                const moduleDeps = await this._getChildDependenciesAndManifest(parent.name, parent.version, parent.branch, parent.contextIds);
                parent.manifest = moduleDeps.manifest;

                if (!moduleDeps.manifest || !moduleDeps.dependencies) return;

                const optimizedDeps = await Promise.all(moduleDeps.dependencies.map(d => this.optimizeDependency(d.name, d.version, d.branch, parent.contextIds)));

                for (const dep of optimizedDeps) {
                    if (!dependencies.find(d => areModulesEqual(d, dep))) {
                        const depToPush = { ...dep, manifest: null, contextIds: parent.contextIds };
                        dependencies.push(depToPush);
                        await resolve(depToPush);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }

        await Promise.all(dependencies.map(d => resolve(d)));

        // reverse() - the lowest script in the hierarchy should be loaded first
        return dependencies.reverse().filter(d => !!d.manifest);
    }

    public async loadScript(url: StorageRef) {
        const resource = await this._storage.getResource(url);
        const script = new TextDecoder("utf-8").decode(new Uint8Array(resource));
        return script;
    }

    public async loadJson(url: StorageRef) {
        const resource = await this._storage.getResource(url);
        const json = new TextDecoder("utf-8").decode(new Uint8Array(resource));
        const object = JSON.parse(json);
        return object;
    }

    //ToDo: rework the _getChildDependencies and move it into Inpage
    private async _getChildDependenciesAndManifest(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME, contextIds: string[]) {
        const vi = await this.registryAggregator.getVersionInfo(name, branch, version);

        if (vi.name != name || vi.version != version || vi.branch != branch) {
            console.error(`Invalid public name for module. Requested: ${name}#${branch}@${version}. Recieved: ${vi.name}#${vi.branch}@${vi.version}.`);
            return { manifest: vi, dependencies: [] };
        }

        if (vi.type === ModuleTypes.Interface) {
            console.error(`An implementation of the interface ${name} is not found.`);
            return { manifest: vi, dependencies: [] };
        }

        if (!vi.dependencies) return { manifest: vi, dependencies: [] };

        const dependencies: { name: string, branch: string, version: string }[] = [];

        Object.getOwnPropertyNames(vi.dependencies).forEach(name => {
            const dependency = vi.dependencies[name];

            if (typeof dependency === "string") { // only version is specified
                dependencies.push({
                    name: name,
                    branch: DEFAULT_BRANCH_NAME,
                    version: dependency
                });
            } else if (typeof dependency === "object") { // branch is specified
                if (!dependency[DEFAULT_BRANCH_NAME]) {
                    console.error(`Default branch version is not specified.`);
                    return;
                }

                dependencies.push({
                    name: name,
                    branch: DEFAULT_BRANCH_NAME,
                    version: dependency[DEFAULT_BRANCH_NAME]
                });
            } else {
                console.error(`Invalid dependencies in manifest.`);
            }
        });

        return { manifest: vi, dependencies };
    }

    public async optimizeDependency(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME, contextIds: string[]): Promise<{ name: string, version: string, branch: string }> {
        const mi = await this._findImplementation(name, branch, version, contextIds);
        if (mi) {
            console.log(`Found implementation for ${name}#${branch}@${version} interface: ${mi.name}`);
            name = mi.name;
            branch = "default";
            version = "0.0.1"; // ToDo: fix it
        }
        
        // ToDo: Fetch prefix from global settings.
        // ToDo: Replace '>=' to '^'
        const prefix = '>='; // https://devhints.io/semver
        const range = prefix + version;

        const allVersions = await this.registryAggregator.getVersions(name, branch);

        if (allVersions.length === 0) {
            throw new Error(`The module ${name}#${branch} doesn't have any versions.`);
        }

        const optimizedVersion = maxSatisfying(allVersions, range);

        // ToDo: catch null in optimizedVersion

        if (version != optimizedVersion) {
            addEvent('Dependency Optimizer', `Package "${name}#${branch}" version has been upgraded from ${version} to ${optimizedVersion}.`);
        }

        return {
            name: name,
            branch: branch,
            version: optimizedVersion
        };
    }

    private async _findImplementation(name: string, branch: string, version: string, contextIds: string[]) {
        const users = await this._globalConfigService.getTrustedUsers().then(u => u.map(a => a.account));
        const modules = await this.registryAggregator.getModuleInfoWithRegistries(contextIds, users);
        
        for (const registry in modules) {
            for (const hostname in modules[registry]) {
                for (const mi of modules[registry][hostname]) {
                    if (mi.interfaces && mi.interfaces.indexOf(name) !== -1) {
                        return mi;
                    }
                }
            }
        }

        return null;
    }
}