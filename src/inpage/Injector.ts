import { initBGFunctions } from "chrome-extension-message-wrapper";
import { WebSocketProxyClient } from "../utils/chrome-extension-websocket-wrapper";
import Core from './Core'

export default class Injector {

    async init() {
        const {
            getActiveScriptsByHostname
        } = await initBGFunctions(chrome);

        const hostname = window.location.hostname;

        const scripts: string[] = await getActiveScriptsByHostname(hostname);

        if (!scripts.length) return;

        const core = new Core();

        const modules: { name: string, version: string, clazz: any, instance: any, isFeature: boolean }[] = [];

        for (const script of scripts) {
            const execScript = new Function('PublicName', 'Load', 'Core', 'WebSocketProxyClient', script);

            const publicName = function (name: string, version: string, isFeature?: boolean): Function {
                return (target: Function) => {
                    if (!modules.find(m => m.name == name && m.version == version)) {
                        modules.push({
                            name: name,
                            version: version,
                            clazz: target,
                            instance: null,
                            isFeature: !!isFeature
                        })
                    }
                }
            }

            const loadDecorator = function (name: string, version: string): Function {
                return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                    // if (!modules.find(m => m.name == name && m.version == version)) {
                    //     modules.push({ id: id });
                    // }

                    descriptor = descriptor || {};
                    descriptor.get = function (this: any): any {
                        return modules.find(m => m.name == name && m.version == version).instance;
                    }
                    return descriptor;
                };
            }

            const result = execScript(publicName, loadDecorator, core, WebSocketProxyClient);
        }

        for (let i = 0; i < modules.length; i++) {
            modules[i].instance = new modules[i].clazz();
        }

        // feature activation
        modules.filter(m => m.isFeature === true).map(m => m.instance.activate());
    }
}