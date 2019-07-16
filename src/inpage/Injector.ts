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
            type: ModuleTypes
        }[] = await getActiveModulesByHostname(hostname);

        if (!modules.length) return;

        const registry: { name: string, version: string, clazz: any, instance: any, type: ModuleTypes }[] = [];

        const loadDecorator = function (name: string, version: string): Function {
            return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                descriptor = descriptor || {};
                descriptor.get = function (this: any): any {
                    // ToDo: Fix error "TypeError: Cannot read property 'instance' of undefined"
                    const versions = registry.filter(m => m.name == name).map(m => m.version);

                    // ToDo: Should be moved to the background? 
                    // ToDo: Fetch prefix from global settings.
                    // ToDo: Replace '>=' to '^'
                    const prefix = '>='; // https://devhints.io/semver
                    const range = prefix + version;

                    const maxVer = maxSatisfying(versions, range);

                    return registry.find(m => m.name == name && m.version == maxVer).instance;
                }
                return descriptor;
            };
        }

        const core = new Core(); // ToDo: is it global for all modules?

        for (const module of modules) {
            const execScript = new Function('Load', 'Core', 'SubscribeOptions', 'Module', module.script);

            const result = execScript(loadDecorator, core, SubscribeOptions, () => (target: Function) => {
                if (!registry.find(m => m.name == module.name && m.version == module.version)) {
                    registry.push({
                        name: module.name,
                        version: module.version,
                        clazz: target,
                        instance: null,
                        type: module.type
                    })
                }                
            });
        }

        for (let i = 0; i < registry.length; i++) {
            // feature initialization
            registry[i].instance = new registry[i].clazz();
        }

        console.log('registry',registry);
    }
}