import { maxSatisfying, rcompare } from 'semver';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';
import Manifest from '../models/manifest';
import { addEvent } from '../services/eventService';
import { RegistryAggregator } from '../registries/registryAggregator';
import { StorageAggregator } from '../moduleStorages/moduleStorage';
import { areModulesEqual } from '../../common/helpers';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';
import { StorageRef } from '../registries/registry';

export default class ModuleManager {

    public registryAggregator = new RegistryAggregator();
    private _storage = new StorageAggregator();

    public async resolveDependencies(modules: { name: string, version: string, branch?: string }[]) {

        // ToDo: Add dependency optimizer
        // Search for the following topics: 
        // 1. Topological Sorting
        // 2. Dependency Resolution Algorithm

        let dependencies: { name: string, branch: string, version: string, manifest: VersionInfo }[] =
            modules.map(({ name, version, branch }) => ({ name, version, branch: !branch ? DEFAULT_BRANCH_NAME : branch, manifest: null }));

        const resolve = async (parent: { name: string, branch: string, version: string, manifest: VersionInfo }) => {
            try {
                const moduleDeps = await this._getChildDependenciesAndManifest(parent.name, parent.version, parent.branch);
                parent.manifest = moduleDeps.manifest;

                if (!moduleDeps.manifest || !moduleDeps.dependencies) return;

                const optimizedDeps = await Promise.all(moduleDeps.dependencies.map(d => this.optimizeDependency(d.name, d.version, d.branch)));

                for (const dep of optimizedDeps) {
                    if (!dependencies.find(d => areModulesEqual(d, dep))) {
                        const depToPush = { ...dep, manifest: null };
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

    //ToDo: rework the _getChildDependencies and move it into Inpage
    private async _getChildDependenciesAndManifest(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME) {

        const vi = await this.registryAggregator.getVersionInfo(name, branch, version);

        if (vi.name != name || vi.version != version || vi.branch != branch) {
            console.error(`Invalid public name for module. Requested: ${name}#${branch}@${version}. Recieved: ${vi.name}#${vi.branch}@${vi.version}.`);
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

    public async optimizeDependency(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME): Promise<{ name: string, version: string, branch: string }> {
        // ToDo: Fetch prefix from global settings.
        // ToDo: Replace '>=' to '^'
        const prefix = '>='; // https://devhints.io/semver
        const range = prefix + version;

        const allVersions = await this.registryAggregator.getVersions(name, branch);
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

    // public async getFeaturesByHostnames(hostnames: string[]): Promise<{ [hostname: string]: Manifest[] }> {
    //     if (!hostnames || hostnames.length === 0) return {};
    //     const hostnameFeatures = await this.registryAggregator.getFeatures(hostnames); // result.hostname.featureName[branchIndex]
    //     const hostnameManifests: { [hostname: string]: Manifest[] } = {};

    //     for (const hostname in hostnameFeatures) {
    //         hostnameManifests[hostname] = [];
    //         const features = hostnameFeatures[hostname];
    //         for (const name in features) {
    //             const branches = features[name];
    //             const branch = branches[0]; // ToDo: select branch
    //             const versions = await this.registryAggregator.getVersions(name, branch);
    //             const lastVersion = versions.sort(rcompare)[0]; // DESC sorting by semver // ToDo: select version
    //             if (!lastVersion) continue;
    //             const manifest = await this.registryAggregator.getVersionInfo(name, branch, lastVersion);
    //             hostnameManifests[hostname].push(manifest);
    //         }
    //     }

    //     return hostnameManifests;
    // }

    // ToDo: remove it?
    // public async getFeaturesByHostnamesWithRegistries(hostnames: string[], users: string[]): Promise<{ [registryUrl: string]: { [hostname: string]: ModuleInfo[] } }> {
    //     if (!hostnames || hostnames.length === 0) return {};
    //     const hostnameManifests = await this.registryAggregator.getManifestsWithRegistries(hostnames, users);
    //     return hostnameManifests;
    // }

    // // ToDo: remove it?
    // private async _loadManifestByBranch(name: string, branch: string, replaceUri: boolean) {
    //     const versions = await this.registryAggregator.getVersions(name, branch);
    //     const lastVersion = versions.sort(rcompare)[0]; // DESC sorting by semver // ToDo: select version
    //     if (!lastVersion) return;
    //     const manifest = await this.loadManifest(name, branch, lastVersion, replaceUri);
    //     return manifest;
    // }

    public async getAllDevModules(): Promise<Manifest[]> {
        const modules = await this.registryAggregator.getAllDevModules();
        const manifestsWithErrors = await Promise.all(modules.map(m => this.registryAggregator.getVersionInfo(m.name, m.branch, m.version).catch(Error)));
        const manifestsNoErrors = manifestsWithErrors.filter(x => !(x instanceof Error)) as Manifest[];
        return manifestsNoErrors;
    }
}