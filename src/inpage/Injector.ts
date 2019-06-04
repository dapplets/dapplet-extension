import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './Core'

export default class Injector {

    async init() {

        const {
            getActiveFeatureIdsByHostname,
            getScriptById
        } = await initBGFunctions(chrome);

        const hostname = window.location.hostname;

        const featureIds: string[] = await getActiveFeatureIdsByHostname(hostname);

        if (!featureIds.length) return;

        const core = new Core();

        const modules: { id: string, clazz?: any, instance?: any }[] = [];
        const links: { target: any, propertyKey: any, id: string }[] = [];

        function loadDecorator(id: string): Function {
            return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                links.push({ target, propertyKey, id });

                if (!modules.find(x => x.id == id)) {
                    modules.push({ id: id });
                }

                descriptor = descriptor || {};
                descriptor.get = function (this: any): any {
                    return modules.find(m => m.id === id).instance;
                }
                return descriptor;
            };
        }

        for (const id of featureIds) {
            modules.push({ id: id });
        }

        for (let i = 0; i < modules.length; i++) {
            const userScriptText = await getScriptById(modules[i].id);
            const getClassFromModule = new Function('Load', 'Core', 'return ' + userScriptText);
            const moduleFunction : Function = getClassFromModule(loadDecorator, core);
            modules[i].clazz = this.getLastModule(moduleFunction).default;
        }

        for (let i = modules.length - 1; i >= 0; i--) {
            modules[i].instance = new modules[i].clazz();
        }

        featureIds.forEach(id => modules.find(m => m.id == id).instance.activate());
    }

    private getLastModule(func: Function): any {
        // ToDo: Here is a black magic!
        let module = null;
        for (let i = 10; i >= 0; i--) {
            try {
                module = func(i);
                if (module) break;
            } catch { }
        }
        return module;
    }
}