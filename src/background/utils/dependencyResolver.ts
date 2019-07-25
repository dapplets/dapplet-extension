import { Storage } from '../storages/storage';
import { Registry } from '../registries/registry';
import { maxSatisfying } from 'semver';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';
import Manifest from '../models/manifest';

export default class DependencyResolver {

    constructor(private _registry: Registry, private _storage: Storage) { }

    public async resolve(modules: { name: string, version: string, branch?: string }[]): Promise<{ name: string, version: string, branch: string }[]> {

        // ToDo: Add dependency optimizer
        // Search for the following topics: 
        // 1. Topological Sorting
        // 2. Dependency Resolution Algorithm

        let dependencies = [...modules.map(({ name, version, branch }) => ({ name, version, branch: !branch ? DEFAULT_BRANCH_NAME : branch }))];

        for (let i = 0; i < dependencies.length; i++) {
            const parent = dependencies[i];
            const moduleDeps = await this._getChildDependencies(parent.name, parent.version, parent.branch);
            const optimizedDeps = await Promise.all(moduleDeps.map(d => this._optimizeDependency(d.name, d.version, d.branch)));

            for (const dep of optimizedDeps) {
                if (!dependencies.find(d => d.name == dep.name && d.version == dep.version && d.branch == dep.branch)) {
                    dependencies.push(dep);
                }
            }
        }

        // reverse() - the lowest script in the hierarchy should be loaded first
        return dependencies.reverse();
    }

    //ToDo: rework the _getChildDependencies and move it into Inpage
    private async _getChildDependencies(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME): Promise<{ name: string, branch: string, version: string }[]> {

        const manifestUri = await this._registry.resolveToUri(name, branch, version);
        const manifestBufferArray = await this._storage.getResource(manifestUri[0]);
        const manifestJson = String.fromCharCode.apply(null, new Uint8Array(manifestBufferArray));
        const manifest: Manifest = JSON.parse(manifestJson);

        if (manifest.name != name || manifest.version != version || manifest.branch != branch) {
            console.error(`Invalid public name for module. Requested: ${name}#${branch}@${version}. Recieved: ${manifest.name}#${manifest.branch}@${manifest.version}.`);
            return [];
        }

        if (!manifest.dependencies) return [];

        const dependencies: { name: string, branch: string, version: string }[] = [];

        Object.getOwnPropertyNames(manifest.dependencies).forEach(name => {
            const dependency = manifest.dependencies[name];

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

        return dependencies;
    }

    private async _optimizeDependency(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME): Promise<{ name: string, version: string, branch: string }> {
        // ToDo: Fetch prefix from global settings.
        // ToDo: Replace '>=' to '^'
        const prefix = '>='; // https://devhints.io/semver
        const range = prefix + version;

        const allVersions = await this._registry.getVersions(name, branch);
        const optimizedVersion = maxSatisfying(allVersions, range);

        if (version != optimizedVersion) {
            console.warn(`[Dependency Optimizer] Package "${name}" version has been upgraded from ${version} to ${optimizedVersion}.`);
        }

        return {
            name: name,
            branch: branch,
            version: optimizedVersion
        };
    }
}