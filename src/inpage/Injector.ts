import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './Core';
import { maxSatisfying } from 'semver';

export default class Injector {

    async init() {
        const {
            getActiveScriptsByHostname
        } = await initBGFunctions(chrome);

        const hostname = window.location.hostname;

        const scripts: string[] = await getActiveScriptsByHostname(hostname);

        if (!scripts.length) return;


        const modules: { name: string, version: string, clazz: any, instance: any, isFeature: boolean }[] = [];

        const moduleDecorator = function (name: string, version: string, isFeature?: boolean): Function {
            return (target: Function) => {
                if (!modules.find(m => m.name == name && m.version == version)) {
                    modules.push({
                        name: name,
                        version: version,
                        clazz: target,
                        instance: null,
                        isFeature: !!isFeature // ToDo: remove isFeature parameter
                    })
                }
            }
        }

        const loadDecorator = function (name: string, version: string): Function {
            return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                descriptor = descriptor || {};
                descriptor.get = function (this: any): any {
                    // ToDo: Fix error "TypeError: Cannot read property 'instance' of undefined"
                    const versions = modules.filter(m => m.name == name).map(m => m.version);

                    // ToDo: Should be moved to the background? 
                    // ToDo: Fetch prefix from global settings.
                    // ToDo: Replace '>=' to '^'
                    const prefix = '>='; // https://devhints.io/semver
                    const range = prefix + version;

                    const maxVer = maxSatisfying(versions, range);

                    return modules.find(m => m.name == name && m.version == maxVer).instance;
                }
                return descriptor;
            };
        }

        for (const script of scripts) {
            const core = new Core();
            const execScript = new Function('Module', 'Load', 'Core', script);
            const result = execScript(moduleDecorator, loadDecorator, core);
        }

        for (let i = 0; i < modules.length; i++) {
            // feature initialization
            modules[i].instance = new modules[i].clazz();
        }
    }
}