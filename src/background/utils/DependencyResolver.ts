import NameResolver from '../utils/NameResolver';
import ResourceLoader from './ResourceLoader';
import { maxSatisfying } from 'semver';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';

export default class DependencyResolver {

    constructor(private _nameResolver: NameResolver, private _resourceLoader: ResourceLoader) {

    }


    public async resolve(modules: { name: string, version: string, branch?: string }[]): Promise<{ name: string, version: string, branch: string }[]> {

        // ToDo: Add dependency optimizer
        // Search for the following topics: 
        // 1. Topological Sorting
        // 2. Dependency Resolution Algorithm

        let dependencies = [...modules.map(({ name, version, branch }) => ({ name, version, branch: !branch ? DEFAULT_BRANCH_NAME : branch }))];

        for (let i = 0; i < dependencies.length; i++) {
            const parent = dependencies[i];

            const moduleDeps = await this.getChildDependencies(parent.name, parent.version, parent.branch);
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
    public async getChildDependencies(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME): Promise<{ name: string, version: string, branch: string }[]> {

        const manifestUri = await this._nameResolver.resolve(name, version, branch);
        const manifestJson = await this._resourceLoader.load(manifestUri);
        const manifest = JSON.parse(manifestJson);

        if (manifest.name != name || manifest.version != version || manifest.branch != branch) {
            console.error(`Invalid public name for module. Requested: ${name}#${branch}@${version}. Recieved: ${manifest.name}#${manifest.branch}@${manifest.version}.`);
            return [];
        }

        if (!manifest.dependencies) return [];

        const dependencies = Object.getOwnPropertyNames(manifest.dependencies).map(n => ({
            name: n,
            branch: DEFAULT_BRANCH_NAME, // ToDo: should we store branch name inside manifest's dependencies?
            version: manifest.dependencies[n]
        }));

        return dependencies;
    }

    private async _optimizeDependency(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME): Promise<{ name: string, version: string, branch: string }> {
        // ToDo: Fetch prefix from global settings.
        // ToDo: Replace '>=' to '^'
        const prefix = '>='; // https://devhints.io/semver
        const range = prefix + version;

        const allVersions = await this._nameResolver.getVersionsByName(name, branch);
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