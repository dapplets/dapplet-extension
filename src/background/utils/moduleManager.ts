import { maxSatisfying, rcompare } from 'semver';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';
import Manifest from '../models/manifest';
import { addEvent } from '../services/eventService';
import { RegistryAggregator } from '../registries/registryAggregator';
import { StorageAggregator } from '../moduleStorages/moduleStorage';
import { areModulesEqual } from '../../common/helpers';

export default class ModuleManager {

    public registryAggregator = new RegistryAggregator();
    private _storage = new StorageAggregator();

    public async resolveDependencies(modules: { name: string, version: string, branch?: string }[]): Promise<{ name: string, version: string, branch: string }[]> {

        // ToDo: Add dependency optimizer
        // Search for the following topics: 
        // 1. Topological Sorting
        // 2. Dependency Resolution Algorithm

        let dependencies = [...modules.map(({ name, version, branch }) => ({ name, version, branch: !branch ? DEFAULT_BRANCH_NAME : branch }))];

        for (let i = 0; i < dependencies.length; i++) {
            const parent = dependencies[i];
            const moduleDeps = await this._getChildDependencies(parent.name, parent.version, parent.branch);
            const optimizedDeps = await Promise.all(moduleDeps.map(d => this.optimizeDependency(d.name, d.version, d.branch)));

            for (const dep of optimizedDeps) {
                if (!dependencies.find(d => areModulesEqual(d, dep))) {
                    dependencies.push(dep);
                }
            }
        }

        // reverse() - the lowest script in the hierarchy should be loaded first
        return dependencies.reverse();
    }

    public async loadModule(name: string, branch: string, version: string): Promise<{ script: string, manifest: Manifest }> {
        const manifest = await this.loadManifest(name, branch, version);
        const resource = await this._storage.getResource(manifest.dist);
        const script = new TextDecoder("utf-8").decode(new Uint8Array(resource));

        return { script, manifest };
    }

    public async loadManifest(name: string, branch: string, version: string): Promise<Manifest> {
        const manifestUris = await this.registryAggregator.resolveToUri(name, branch, version);
        const manfiestUri = manifestUris[0]; // ToDo: select uri
        // ToDo: try to load a manifest from each uris
        const manifestBufferArray = await this._storage.getResource(manfiestUri);
        // ToDo: check hash
        const manifestJson = new TextDecoder("utf-8").decode(new Uint8Array(manifestBufferArray));
        const manifest: Manifest = JSON.parse(manifestJson);

        // convert a relative URL to absolute
        if (!(/^(?:[a-z]+:)?\/\//i.test(manifest.dist))) {
            manifest.dist = new URL(manifest.dist, manfiestUri).href;
        }

        return manifest;
    }

    //ToDo: rework the _getChildDependencies and move it into Inpage
    private async _getChildDependencies(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME): Promise<{ name: string, branch: string, version: string }[]> {

        const manifest = await this.loadManifest(name, branch, version);

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

    public async getFeaturesByHostnames(hostnames: string[]): Promise<{ [hostname: string]: Manifest[] }> {
        if (!hostnames || hostnames.length === 0) return {};
        const hostnameFeatures = await this.registryAggregator.getFeatures(hostnames); // result.hostname.featureName[branchIndex]
        const hostnameManifests: { [hostname: string]: Manifest[] } = {};

        for (const hostname in hostnameFeatures) {
            hostnameManifests[hostname] = [];
            const features = hostnameFeatures[hostname];
            for (const name in features) {
                const branches = features[name];
                const branch = branches[0]; // ToDo: select branch
                const versions = await this.registryAggregator.getVersions(name, branch);
                const lastVersion = versions.sort(rcompare)[0]; // DESC sorting by semver // ToDo: select version
                const manifest = await this.loadManifest(name, branch, lastVersion);
                hostnameManifests[hostname].push(manifest);
            }
        }

        return hostnameManifests;
    }

    // ToDo: refactor it
    public async getFeaturesByHostnamesWithRegistries(hostnames: string[]): Promise<{ [registryUrl: string]: { [hostname: string]: Manifest[] } }> {
        if (!hostnames || hostnames.length === 0) return {};
        const hostnameFeatures = await this.registryAggregator.getFeaturesWithRegistries(hostnames); // result.hostname.featureName[branchIndex]
        const hostnameManifests: { [registryUrl: string]: { [hostname: string]: Manifest[] } } = {};

        for (const registryUrl in hostnameFeatures) {
            hostnameManifests[registryUrl] = {};
            for (const hostname in hostnameFeatures[registryUrl]) {
                hostnameManifests[registryUrl][hostname] = [];
                const features = hostnameFeatures[registryUrl][hostname];
                for (const name in features) {
                    const branches = features[name];
                    const branch = branches[0]; // ToDo: select branch
                    const versions = await this.registryAggregator.getVersions(name, branch);
                    const lastVersion = versions.sort(rcompare)[0]; // DESC sorting by semver // ToDo: select version
                    try {
                        const manifest = await this.loadManifest(name, branch, lastVersion);
                        hostnameManifests[registryUrl][hostname].push(manifest);
                    } catch (err) {
                        // ToDo: catch it
                    }
                }
            }
        }

        return hostnameManifests;
    }

    public async getAllDevModules(): Promise<Manifest[]> {
        const modules = await this.registryAggregator.getAllDevModules();
        const manifestsWithErrors = await Promise.all(modules.map(m => this.loadManifest(m.name, m.branch, m.version).catch(Error)));
        const manifestsNoErrors = manifestsWithErrors.filter(x => !(x instanceof Error)) as Manifest[];
        return manifestsNoErrors;
    }
}