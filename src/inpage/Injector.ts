import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './Core';
import { maxSatisfying } from 'semver';
import { SubscribeOptions } from './overlay';
import { ModuleTypes } from '../common/constants';

export default class Injector {

    async init() {
        const {
            getActiveModulesByHostname
        } = await initBGFunctions(chrome);

        const hostname = window.location.hostname;

        const modules: {
            name: string,
            version: string,
            script: string,
            type: ModuleTypes,
            manifest: any
        }[] = await getActiveModulesByHostname(hostname);

        console.log('modules', modules);

        if (!modules.length) return;

        const registry: { name: string, version: string, clazz: any, instance: any, type: ModuleTypes }[] = [];

        const core = new Core(); // ToDo: is it global for all modules?

        for (const module of modules) {
            const execScript = new Function('Core', 'SubscribeOptions', 'Load', 'Module', module.script);

            const loadDecorator = (name: string) => (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                descriptor = descriptor || {};
                descriptor.get = function (this: any): any {
                    // ToDo: Fix error "TypeError: Cannot read property 'instance' of undefined"
                    const versions = registry.filter(m => m.name == name).map(m => m.version);

                    // ToDo: Should be moved to the background? 
                    // ToDo: Fetch prefix from global settings.
                    // ToDo: Replace '>=' to '^'
                    const prefix = '>='; // https://devhints.io/semver
                    const range = prefix + module.manifest.dependencies[name];

                    const maxVer = maxSatisfying(versions, range);

                    return registry.find(m => m.name == name && m.version == maxVer).instance;
                }
                return descriptor;
            };

            const moduleDecorator = () => (target: Function) => {
                if (!registry.find(m => m.name == module.name && m.version == module.version)) {
                    registry.push({
                        name: module.name,
                        version: module.version,
                        clazz: target,
                        instance: null,
                        type: module.type
                    })
                }
            };

            const result = execScript(core, SubscribeOptions, loadDecorator, moduleDecorator);
        }

        for (let i = 0; i < registry.length; i++) {
            // feature initialization
            registry[i].instance = new registry[i].clazz();
        }

        console.log('registry', registry);
    }
}