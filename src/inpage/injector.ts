import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './core';
import { maxSatisfying } from 'semver';
import { SubscribeOptions } from './overlay';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../common/constants';
import * as extension from 'extensionizer';

export class Injector {
    private registry: { 
        name: string, 
        branch: string,
        version: string, 
        clazz: any, 
        instance: any, 
        type: ModuleTypes 
    }[] = [];

    constructor(public core: Core) { }

    public async loadActiveModules() {
        const { getActiveModulesByHostname } = await initBGFunctions(extension);

        const modules = await getActiveModulesByHostname(window.location.hostname);
        await this.loadModules(modules);
    }

    public async loadModules(modules: { name: string, branch: string, version: string }[]) {
        if (!modules || !modules.length) return;
        const { getModulesWithDeps } = await initBGFunctions(extension);
        const loadedModules = await getModulesWithDeps(modules);
        await this._processModules(loadedModules);
        for (let i = 0; i < this.registry.length; i++) {
            // feature initialization
            if (!this.registry[i].instance) {
                this.registry[i].instance = new this.registry[i].clazz();
            }
        }
    }

    private async _processModules(modules) {
        const { optimizeDependency, getModulesWithDeps } = await initBGFunctions(extension);

        for (const { manifest, script } of modules) {
            // Module is loaded already
            if (this.registry.find(m => m.name == manifest.name && m.branch == manifest.branch && m.version == manifest.version)) continue;

            const execScript = new Function('Core', 'SubscribeOptions', 'Inject', 'Injectable', script);
            if (manifest.type == ModuleTypes.Resolver) {
                let branch = null;
                // ToDo: add dependency support for resolver
                const injectDecorator = () => { };
                const injectableDecorator = (constructor) => {
                    const resolver = new constructor();
                    branch = resolver.getBranch();
                };

                // ToDo: do not exec resolver twice (when second feature is activated)
                execScript(this.core, SubscribeOptions, injectDecorator, injectableDecorator);

                console.log(`Resolver of "${manifest.name}" defined the "${branch}" branch`);
                const optimizedBranch = await optimizeDependency(manifest.name, branch, manifest.version);
                const missingDependencies = await getModulesWithDeps([optimizedBranch]);
                await this._processModules(missingDependencies);
            } else {
                // ToDo: describe it
                const injectableDecorator = (constructor: Function) => {
                    if (!this.registry.find(m => m.name == manifest.name && m.branch == manifest.branch && m.version == manifest.version)) {
                        this.registry.push({
                            name: manifest.name,
                            version: manifest.version,
                            branch: manifest.branch,
                            clazz: constructor,
                            instance: null,
                            type: manifest.type
                        });
                    }
                };

                // ToDo: describe it
                const injectDecorator = (name: string) => (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                    descriptor = descriptor || {};
                    descriptor.get = () => {
                        // ToDo: Fix error "TypeError: Cannot read property 'instance' of undefined"
                        const versions = this.registry.filter(m => m.name == name).map(m => m.version);
                        const dependency = manifest.dependencies[name];

                        // ToDo: Should be moved to the background? 
                        // ToDo: Fetch prefix from global settings.
                        // ToDo: Replace '>=' to '^'
                        const prefix = '>='; // https://devhints.io/semver
                        const range = prefix + (typeof dependency === "string" ? dependency : dependency[DEFAULT_BRANCH_NAME]);

                        const maxVer = maxSatisfying(versions, range);

                        return this.registry.find(m => m.name == name && m.version == maxVer).instance;
                    }
                    return descriptor;
                };

                execScript(this.core, SubscribeOptions, injectDecorator, injectableDecorator);
            }
        }
    }
}