import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './core';
import { maxSatisfying, valid } from 'semver';
import { SubscribeOptions } from './overlay';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../common/constants';
import * as extension from 'extensionizer';
import { IResolver, IContentAdapter, IFeature } from './types';
import { areModulesEqual } from "../common/helpers";
import VersionInfo from "../background/models/versionInfo";
import { AppStorage } from "./appStorage";
import { DefaultConfig, SchemaConfig } from "../common/types";

export class Injector {
    public availableContextIds: string[] = [];

    private registry: {
        manifest: VersionInfo,
        clazz: any,
        instance?: any,
        order: number,
        contextIds: string[],
        dependencies: string[],
        instancedDeps: any[],
        defaultConfig?: DefaultConfig
    }[] = [];

    constructor(public core: Core) {
        this._setContextActivivty([window.location.hostname], undefined, true);
        window.exports = {}; // for CommonJS modules compatibility
    }

    public async loadModules(modules: { name: string, branch: string, version: string, order: number, contextIds: string[] }[]) {
        if (!modules || !modules.length) return;
        const { getModulesWithDeps } = await initBGFunctions(extension);
        const loadedModules: { manifest: VersionInfo, script: string, defaultConfig?: DefaultConfig }[] = await getModulesWithDeps(modules);
        const orderedModules = loadedModules.map((l) => {
            const m = modules.find(m => areModulesEqual(m, l.manifest));
            return ({
                ...l,
                order: m?.order,
                contextIds: m?.contextIds || [window.location.hostname]
            })
        });

        await this._processModules(orderedModules);

        // module initialization
        for (let i = 0; i < this.registry.length; i++) {
            const m = this.registry[i];
            if (m.instance) continue;
            m.instancedDeps = m.dependencies.map(d => {
                const depModule = this._getDependency(m.manifest, d);
                if (depModule.manifest.type === ModuleTypes.Adapter) {
                    const cfgKey = Symbol();
                    return new Proxy(depModule.instance, {
                        get: function (target: IContentAdapter<any>, prop, receiver) {
                            if (prop === 'attachConfig') {
                                return (cfg: any) => {
                                    if (m.manifest.type === ModuleTypes.Feature) {
                                        cfg.orderIndex = m.order;
                                        // ToDo: fix context ids adding
                                        cfg.contextIds = m.contextIds.map(id => {
                                            const [headContextId, ...tailContextId] = id.split('/'); // ToDo: check head?
                                            return tailContextId.join('/');
                                        }).filter(id => !!id);
                                    }
                                    Reflect.set(target, cfgKey, cfg);
                                    target.attachConfig(cfg);
                                }
                            } if (prop === 'detachConfig') {
                                return () => target.detachConfig(Reflect.get(target, cfgKey));
                            } else return target[prop];
                        }
                    });
                } else {
                    return depModule.instance;
                }
            });

            try {
                // ToDo: compare "m.instancedDeps.length" and "m.clazz.constructor.length"
                m.instance = new m.clazz(...m.instancedDeps);
                console.log(`The module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version} is loaded.`);
                extension.runtime.sendMessage({
                    type: "FEATURE_LOADED", payload: {
                        name: m.manifest.name, branch: m.manifest.branch, version: m.manifest.version
                    }
                });
            } catch (err) {
                console.error(`Error of loading the module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version}: `, err);
                extension.runtime.sendMessage({
                    type: "FEATURE_LOADING_ERROR", payload: {
                        name: m.manifest.name, branch: m.manifest.branch, version: m.manifest.version, error: err.message
                    }
                });
            }
        }
    }

    public async unloadModules(modules: { name: string, branch: string, version: string }[]) {
        modules.map(m => this.registry.find(r => areModulesEqual(m, r.manifest))).forEach(m => {
            if (!m) return;
            try {
                m.instancedDeps.forEach(d => d.detachConfig());
                console.log(`The module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version} is unloaded.`);
                extension.runtime.sendMessage({
                    type: "FEATURE_UNLOADED", payload: {
                        name: m.manifest.name, branch: m.manifest.branch, version: m.manifest.version
                    }
                });
                this.registry = this.registry.filter(r => r !== m);
            } catch (err) {
                console.error(`Error of unloading the module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version}: `, err);
                extension.runtime.sendMessage({
                    type: "FEATURE_UNLOADING_ERROR", payload: {
                        name: m.manifest.name, branch: m.manifest.branch, version: m.manifest.version, error: err.message
                    }
                });
            }
        });
    }

    private async _processModules(modules: { manifest: VersionInfo, script: string, order: number, contextIds: string[], defaultConfig?: DefaultConfig }[]) {
        const { optimizeDependency, getModulesWithDeps, addEvent } = await initBGFunctions(extension);
        const { core } = this;

        for (const { manifest, script, order, contextIds, defaultConfig } of modules) {
            // Module is loaded already
            const registeredModule = this.registry.find(m => areModulesEqual(m.manifest, manifest));
            if (registeredModule) {
                if (contextIds) {
                    if (registeredModule.contextIds) {
                        registeredModule.contextIds.push(...contextIds);
                    } else {
                        registeredModule.contextIds = [...contextIds];
                    }
                }
                continue;
            }

            // ToDo: elemenate the boilerplate
            const coreWrapper = {
                overlayManager: core.overlayManager,
                waitPairingOverlay: core.waitPairingOverlay,
                contextStarted: (contextIds: any[], parentContext: string) => this._setContextActivivty(contextIds, window.location.hostname + (parentContext ? `/${parentContext}` : ""), true),
                contextFinished: (contextIds: any[], parentContext: string) => this._setContextActivivty(contextIds, window.location.hostname + (parentContext ? `/${parentContext}` : ""), false),
                connect: core.connect.bind(core),
                overlay: core.overlay.bind(core),
                wallet: core.wallet.bind(core),
                storage: new AppStorage(manifest.name, manifest.environment, defaultConfig)
            };

            let newBranch: string = null;

            // ToDo: describe it
            const injectableDecorator = (constructor) => {
                if (constructor.prototype.getBranch) {
                    const resolver: IResolver = new constructor();
                    newBranch = resolver.getBranch();
                } else if (!this.registry.find(m => areModulesEqual(m.manifest, manifest))) {
                    this.registry.push({
                        manifest: manifest,
                        clazz: constructor,
                        instance: null,
                        order: order,
                        contextIds: contextIds,
                        dependencies: [],
                        instancedDeps: [],
                        defaultConfig: defaultConfig
                    });
                }
            };

            // ToDo: describe it
            const injectDecorator = (name: string) => (target, propertyKey: string, parameterIndexOrDescriptor: number | PropertyDescriptor) => {
                if (!name) throw new Error('The name of a module is required as the first argument of the @Inject(module_name) decorator');
                if (typeof parameterIndexOrDescriptor !== 'number') throw new Error('@Inject(module_name) decorator can be applied to constructor parameters only');
                // ToDo: check module_name with manifest
                // ToDo: add module source to error description

                //if (typeof parameterIndexOrDescriptor === 'number') { // decorator applied to constructor parameters

                if (!this.registry.find(m => areModulesEqual(m.manifest, manifest))) {
                    this.registry.push({
                        manifest: manifest,
                        clazz: target,
                        instance: null,
                        order: order,
                        contextIds: contextIds,
                        dependencies: [],
                        instancedDeps: []
                    });
                }
                const currentModule = this.registry.find(m => areModulesEqual(m.manifest, manifest));
                currentModule.dependencies[parameterIndexOrDescriptor] = name;

                // } else { // decorator applied to class property
                //     parameterIndexOrDescriptor = parameterIndexOrDescriptor || {};
                //     parameterIndexOrDescriptor.get = () => this._getDependency(manifest, name).instance;
                //     return parameterIndexOrDescriptor;
                // }
            };

            const execScript = new Function('Core', 'SubscribeOptions', 'Inject', 'Injectable', script);
            execScript(coreWrapper, SubscribeOptions, injectDecorator, injectableDecorator);

            if (newBranch) {
                addEvent('Branch resolving', `Resolver of "${manifest.name}" defined the "${newBranch}" branch`);
                const optimizedBranch = await optimizeDependency(manifest.name, newBranch, manifest.version, contextIds);
                const missingDependencies = await getModulesWithDeps([{ ...optimizedBranch, contextIds: contextIds }]);
                await this._processModules(missingDependencies);
            }
        }
    }

    private async _setContextActivivty(contextIds: any[], parentContext: string, isActive: boolean) {
        contextIds = parentContext ? contextIds.map(({ id }) => parentContext + '/' + id) : contextIds;

        if (isActive) {
            contextIds.forEach(id => {
                if (this.availableContextIds.indexOf(id) === -1) {
                    this.availableContextIds.push(id);
                }
            });
        } else {
            contextIds.forEach(id => {
                const index = this.availableContextIds.indexOf(id);
                if (index > -1) this.availableContextIds.splice(index, 1);
            });
        }

        extension.runtime.sendMessage({
            type: isActive ? "CONTEXT_STARTED" : "CONTEXT_FINISHED",
            payload: { contextIds }
        });
    }

    private _getDependency(manifest: VersionInfo, name: string) {
        const dependency = manifest.dependencies[name];

        if (dependency === undefined) {
            console.error(`Module "${name}" doesn't exist in the manifest of "${manifest.name}"`);
            return;
        }

        if (valid(dependency as string) === null) {
            console.error(`Invalid semver version (${dependency}) of module "${name}" in the manifest of "${manifest.name}"`);
            return;
        }

        // if the module can not be found by the name, then trying to find its implementation by interface name
        let modules = this.registry.filter(m => m.manifest.name == name);
        if (modules.length === 0) {
            modules = this.registry.filter(m => m.manifest.interfaces?.[name] !== undefined);
            if (modules.length === 0) {
                console.error(`Can not find neither the module, nor an implementation of the interface "${name}".`);
                return null;
            }
        }

        // ToDo: Should be moved to the background? 
        // ToDo: Fetch prefix from global settings.
        // ToDo: Replace '>=' to '^'
        const prefix = '>='; // https://devhints.io/semver
        const range = prefix + (typeof dependency === "string" ? dependency : dependency[DEFAULT_BRANCH_NAME]);
        const maxVer = maxSatisfying(modules.map(m => m.manifest.version), range);

        const module = modules.find(m => m.manifest.version == maxVer);
        return module;
    }
}