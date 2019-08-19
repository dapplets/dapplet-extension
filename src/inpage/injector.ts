import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './core';
import { maxSatisfying } from 'semver';
import { SubscribeOptions } from './overlay';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../common/constants';
import * as extension from 'extensionizer';

export async function init() {
    const {
        getActiveModulesByHostname,
        getModulesWithDeps,
        optimizeDependency
    } = await initBGFunctions(extension);

    const hostname = window.location.hostname;

    const modules: {
        script: string,
        manifest: {
            name: string,
            branch: string,
            version: string,
            type: ModuleTypes,
            dependencies: {
                [name: string]: string
            }
        }
    }[] = await getActiveModulesByHostname(hostname);

    if (!modules || !modules.length) return;

    const registry: { name: string, version: string, clazz: any, instance: any, type: ModuleTypes }[] = [];

    const core = new Core(); // ToDo: is it global for all modules?

    const processModules = async (modules) => {
        for (const module of modules) {
            const execScript = new Function('Core', 'SubscribeOptions', 'Inject', 'Injectable', module.script);

            if (module.manifest.type == ModuleTypes.Resolver) {
                let branch = null;
                // ToDo: add dependency support for resolver
                const injectDecorator = () => { };
                const injectableDecorator = (constructor) => {
                    const resolver = new constructor();
                    branch = resolver.getBranch();
                };

                execScript(core, SubscribeOptions, injectDecorator, injectableDecorator);

                console.log(`Resolver of "${module.manifest.name}" defined the "${branch}" branch`);
                const optimizedBranch = await optimizeDependency(module.manifest.name, branch, module.manifest.version);
                const missingDependencies = await getModulesWithDeps([optimizedBranch]);
                await processModules(missingDependencies);
            } else {
                const injectableDecorator = (constructor: Function) => {
                    if (!registry.find(m => m.name == module.manifest.name && m.version == module.manifest.version)) {
                        registry.push({
                            name: module.manifest.name,
                            version: module.manifest.version,
                            clazz: constructor,
                            instance: null,
                            type: module.manifest.type
                        });
                    }
                };

                const injectDecorator = (name: string) => (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                    descriptor = descriptor || {};
                    descriptor.get = function (this: any): any {
                        // ToDo: Fix error "TypeError: Cannot read property 'instance' of undefined"
                        const versions = registry.filter(m => m.name == name).map(m => m.version);
                        const dependency = module.manifest.dependencies[name];

                        // ToDo: Should be moved to the background? 
                        // ToDo: Fetch prefix from global settings.
                        // ToDo: Replace '>=' to '^'
                        const prefix = '>='; // https://devhints.io/semver
                        const range = prefix + (typeof dependency === "string" ? dependency : dependency[DEFAULT_BRANCH_NAME]);

                        const maxVer = maxSatisfying(versions, range);

                        return registry.find(m => m.name == name && m.version == maxVer).instance;
                    }
                    return descriptor;
                };

                execScript(core, SubscribeOptions, injectDecorator, injectableDecorator);
            }
        }
    }

    await processModules(modules);

    for (let i = 0; i < registry.length; i++) {
        // feature initialization
        registry[i].instance = new registry[i].clazz();
    }
}