import NameResolver from '../utils/NameResolver';
import ResourceLoader from './ResourceLoader';
import { maxSatisfying } from 'semver';

export default class DependencyResolver {

    constructor(private _nameResolver: NameResolver, private _resourceLoader: ResourceLoader) {

    }


    public async resolve(modules: { name: string, version: string }[]): Promise<{ name: string, version: string }[]> {

        // ToDo: Add dependency optimizer
        // Search for the following topics: 
        // 1. Topological Sorting
        // 2. Dependency Resolution Algorithm

        let dependencies = [...modules];

        for (let i = 0; i < dependencies.length; i++) {
            const parent = dependencies[i];
            const moduleDeps = await this._getChildDependencies(parent.name, parent.version);
            const optimizedDeps = await Promise.all(moduleDeps.map(d => this._optimizeDependency(d.name, d.version)));
            for (const dep of optimizedDeps) {
                if (!dependencies.find(d => d.name == dep.name && d.version == dep.version)) {
                    dependencies.push(dep);
                }
            }
        }

        // reverse() - the lowest script in the hierarchy should be loaded first
        return dependencies.reverse();
    }

    //ToDo: rework the _getChildDependencies and move it into Inpage
    private async _getChildDependencies(name: string, version: string): Promise<{ name: string, version: string }[]> {

        const manifestUri = await this._nameResolver.resolve(name, version);
        const manifestJson = await this._resourceLoader.load(manifestUri);
        const manifest = JSON.parse(manifestJson);

        if (manifest.name != name || manifest.version != version) {
            console.error(`Invalid public name for module. Requested: ${name}@${version}. Recieved: ${manifest.name}@${manifest.version}.`);
            return [];
        }

        if (!manifest.dependencies) return [];

        const dependencies = Object.getOwnPropertyNames(manifest.dependencies).map(n => ({
            name: n,
            version: manifest.dependencies[n]
        }));

        return dependencies;
    }

    private async _optimizeDependency(name: string, version: string): Promise<{ name: string, version: string }> {
        // ToDo: Fetch prefix from global settings.
        // ToDo: Replace '>=' to '^'
        const prefix = '>='; // https://devhints.io/semver
        const range = prefix + version;

        const allVersions = await this._nameResolver.getVersionsByName(name);
        const optimizedVersion = maxSatisfying(allVersions, range);

        if (version != optimizedVersion) {
            console.warn(`[Dependency Optimizer] Package "${name}" version has been upgraded from ${version} to ${optimizedVersion}.`);
        }

        return {
            name: name,
            version: optimizedVersion
        };
    }
}