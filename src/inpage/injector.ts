import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './core';
import { maxSatisfying, valid } from 'semver';
import { SubscribeOptions } from './overlay';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../common/constants';
import { browser } from "webextension-polyfill-ts";
import { IResolver, IContentAdapter, IFeature } from './types';
import { areModulesEqual } from "../common/helpers";
import VersionInfo from "../background/models/versionInfo";
import { AppStorage } from "./appStorage";
import { DefaultConfig, SchemaConfig } from "../common/types";
import * as logger from '../common/logger';
import { ModalDimmer } from "semantic-ui-react";

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
        defaultConfig?: DefaultConfig,
        onActionHandler?: Function,
        onHomeHandler?: Function
    }[] = [];

    constructor(public core: Core) {
        this._setContextActivivty([window.location.hostname], undefined, true);
        window.exports = {}; // for CommonJS modules compatibility
    }

    public async loadModules(modules: { name: string, branch: string, version: string, order: number, contextIds: string[] }[]) {
        if (!modules || !modules.length) return;

        // ToDo: add modules to registry before loading

        const { getModulesWithDeps } = await initBGFunctions(browser);
        const loadedModules: { manifest: VersionInfo, script: string, defaultConfig?: DefaultConfig }[] = await getModulesWithDeps(modules);
        modules.forEach(a => !loadedModules.find(b => a.name === b.manifest.name && a.branch === b.manifest.branch && a.version === b.manifest.version) && console.log(`[DAPPLETS]: Loading of module ${a.name}#${a.branch}@${a.version} was skipped.`));

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
                    const featureId = m.manifest.name;
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
                                return () => target.detachConfig(Reflect.get(target, cfgKey), featureId);
                            } if (prop === 'exports') {
                                if (typeof target.exports === 'function') {
                                    return target.exports(featureId);
                                } else {
                                    return target.exports;
                                }                                
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
                console.log(`[DAPPLETS]: The module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version} is loaded.`);
                browser.runtime.sendMessage({
                    type: "FEATURE_LOADED", payload: {
                        name: m.manifest.name, 
                        branch: m.manifest.branch, 
                        version: m.manifest.version,
                        runtime: {
                            isActionHandler: !!m.onActionHandler,
                            isHomeHandler: !!m.onHomeHandler
                        }
                    }
                });
            } catch (err) {
                logger.error(`Error of loading the module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version}: `, err);
                browser.runtime.sendMessage({
                    type: "FEATURE_LOADING_ERROR", payload: {
                        name: m.manifest.name, 
                        branch: m.manifest.branch, 
                        version: m.manifest.version, 
                        error: err.message
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
                console.log(`[DAPPLETS]: The module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version} is unloaded.`);
                browser.runtime.sendMessage({
                    type: "FEATURE_UNLOADED", payload: {
                        name: m.manifest.name, branch: m.manifest.branch, version: m.manifest.version
                    }
                });
                this.registry = this.registry.filter(r => r !== m);
            } catch (err) {
                logger.error(`Error of unloading the module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version}: `, err);
                browser.runtime.sendMessage({
                    type: "FEATURE_UNLOADING_ERROR", payload: {
                        name: m.manifest.name, branch: m.manifest.branch, version: m.manifest.version, error: err.message
                    }
                });
            }
        });
    }

    public async openDappletAction(moduleName: string) {
        const module = this.registry.find(m => m.manifest.name === moduleName);
        if (!module || !module.instance) throw Error('The dapplet is not activated.');
        
        //while (!module && !module.instance) await new Promise((res) => setTimeout(res, 500));

        module.onActionHandler?.();
    }

    public async openDappletHome(moduleName: string) {
        const module = this.registry.find(m => m.manifest.name === moduleName);
        if (!module || !module.instance) throw Error('The dapplet is not activated.');
        
        //while (!module && !module.instance) await new Promise((res) => setTimeout(res, 500));

        module.onHomeHandler?.();
    }

    public setActionHandler(moduleName: string, handler: Function) {
        const module = this.registry.find(m => m.manifest.name === moduleName);
        module.onActionHandler = handler;
    }

    public setHomeHandler(moduleName: string, handler: Function) {
        const module = this.registry.find(m => m.manifest.name === moduleName);
        module.onHomeHandler = handler;
    }

    private async _processModules(modules: { manifest: VersionInfo, script: string, order: number, contextIds: string[], defaultConfig?: DefaultConfig }[]) {
        const { optimizeDependency, getModulesWithDeps, addEvent } = await initBGFunctions(browser);
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
                wallet: (cfg, eventDef) => core.wallet(cfg, eventDef, manifest.name),
                storage: new AppStorage(manifest.name, manifest.environment, defaultConfig),
                contract: (address, abi) => core.contract(address, abi, manifest.name),
                onAction: (handler: Function) => this.setActionHandler(manifest.name, handler),
                onHome: (handler: Function) => this.setHomeHandler(manifest.name, handler)
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
                //addEvent('Branch resolving', `Resolver of "${manifest.name}" defined the "${newBranch}" branch`);
                const optimizedBranch = await optimizeDependency(manifest.name, newBranch, manifest.version, contextIds);
                const missingDependencies = await getModulesWithDeps([{ ...optimizedBranch, contextIds: contextIds }]);
                await this._processModules(missingDependencies);
            }
        }
    }

    private async _setContextActivivty(contextIds: any[], parentContext: string, isActive: boolean) {
        if (contextIds.length === 0) return;

        contextIds = parentContext ? contextIds.map(({ id }) => parentContext + '/' + id) : contextIds;

        if (isActive) {
            // console.log('Context started:', contextIds);
            contextIds.forEach(id => {
                if (this.availableContextIds.indexOf(id) === -1) {
                    this.availableContextIds.push(id);
                }
            });
        } else {
            // console.log('Context finished:', contextIds);
            contextIds.forEach(id => {
                const index = this.availableContextIds.indexOf(id);
                if (index > -1) this.availableContextIds.splice(index, 1);
            });
        }

        browser.runtime.sendMessage({
            type: isActive ? "CONTEXT_STARTED" : "CONTEXT_FINISHED",
            payload: { contextIds }
        });
    }

    private _getDependency(manifest: VersionInfo, name: string) {
        const dependency = manifest.dependencies[name];

        if (dependency === undefined) {
            logger.error(`Module "${name}" doesn't exist in the manifest of "${manifest.name}"`);
            return;
        }

        if (valid(dependency as string) === null) {
            logger.error(`Invalid semver version (${dependency}) of module "${name}" in the manifest of "${manifest.name}"`);
            return;
        }

        // if the module can not be found by the name, then trying to find its implementation by interface name
        let modules = this.registry.filter(m => m.manifest.name == name);
        if (modules.length === 0) {
            modules = this.registry.filter(m => m.manifest.interfaces?.[name] !== undefined);
            if (modules.length === 0) {
                logger.error(`Can not find neither the module, nor an implementation of the interface "${name}".`);
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