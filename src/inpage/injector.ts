import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './core';
import { maxSatisfying } from 'semver';
import { SubscribeOptions } from './overlay';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../common/constants';
import * as extension from 'extensionizer';
import { IResolver, IContentAdapter, IFeature } from './types';
import Manifest from "../background/models/manifest";
import ManifestDTO from "../background/dto/manifestDTO";

export class Injector {
    public availableContextIds: string[] = [];

    private registry: {
        manifest: Manifest,
        clazz: any,
        instance?: any,
        order: number,
        contextIds: string[]
    }[] = [];

    constructor(public core: Core) {
        this._setContextActivivty([window.location.hostname], undefined, true);
    }

    public async loadModules(modules: { name: string, branch: string, version: string, order: number, contextIds: string[] }[]) {
        if (!modules || !modules.length) return;
        const { getModulesWithDeps } = await initBGFunctions(extension);
        const loadedModules: { manifest: Manifest, script: string }[] = await getModulesWithDeps(modules);
        const orderedModules = loadedModules.map((l) => {
            const m = modules.find(m => m.name === l.manifest.name &&
                m.branch === l.manifest.branch &&
                m.version === l.manifest.version);
            return ({
                ...l,
                order: m?.order,
                contextIds: m?.contextIds || [window.location.hostname]
            })
        });

        await this._processModules(orderedModules);

        // module initialization
        for (let i = 0; i < this.registry.length; i++) {
            if (this.registry[i].instance) continue;
            this.registry[i].instance = new this.registry[i].clazz();
            const m = this.registry[i];
            console.log(`The module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version} was loaded.`);
        }

        // feature attaching
        for (let i = 0; i < this.registry.length; i++) {
            if (this.registry[i].manifest.type === ModuleTypes.Feature) {
                const feature: IFeature = this.registry[i].instance;
                feature.orderIndex = this.registry[i].order;
                // ToDo: fix context ids adding
                feature.contextIds = this.registry[i].contextIds.map(id => {
                    const [headContextId, ...tailContextId] = id.split('/'); // ToDo: check head?
                    return tailContextId.join('/');
                }).filter(id => !!id);
                feature.activate();
            }
        }
    }

    public async unloadModules(modules: { name: string, branch: string, version: string }[]) {
        modules.map(m => this.registry.find(r =>
            m.name === r.manifest.name &&
            m.branch === r.manifest.branch &&
            m.version === r.manifest.version
        )).forEach(m => {
            if (!m) return;
            m.instance.deactivate();
            console.log(`The module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version} was unloaded.`);
            this.registry = this.registry.filter(r => r !== m);
        });
    }

    private async _processModules(modules: { manifest: Manifest, script: string, order: number, contextIds: string[] }[]) {
        const { optimizeDependency, getModulesWithDeps, addEvent } = await initBGFunctions(extension);
        const { core } = this;

        for (const { manifest, script, order, contextIds } of modules) {
            // Module is loaded already
            const registeredModule = this.registry.find(m => m.manifest.name == manifest.name && m.manifest.branch == manifest.branch && m.manifest.version == manifest.version);
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
                connect: core.connect,
                publish: core.publish,
                subscribe: core.subscribe,
                legacyOverlay: core.legacyOverlay,
                waitPairingOverlay: core.waitPairingOverlay,
                sendWalletConnectTx: core.sendWalletConnectTx,
                contextStarted: (contextIds: any[], parentContext: string) => this._setContextActivivty(contextIds, window.location.hostname + (parentContext ? `/${parentContext}` : ""), true),
                contextFinished: (contextIds: any[], parentContext: string) => this._setContextActivivty(contextIds, window.location.hostname + (parentContext ? `/${parentContext}` : ""), false),
                overlay: core.overlay,
                wallet: core.wallet
            };

            const execScript = new Function('Core', 'SubscribeOptions', 'Inject', 'Injectable', script);
            if (manifest.type == ModuleTypes.Resolver) {
                let branch: string = null;
                // ToDo: add dependency support for resolver
                const injectDecorator = () => { };
                const injectableDecorator = (constructor) => {
                    const resolver: IResolver = new constructor();
                    branch = resolver.getBranch();
                };

                // ToDo: do not exec resolver twice (when second feature is activated)
                execScript(coreWrapper, SubscribeOptions, injectDecorator, injectableDecorator);

                addEvent('Branch resolving', `Resolver of "${manifest.name}" defined the "${branch}" branch`);
                const optimizedBranch = await optimizeDependency(manifest.name, branch, manifest.version);
                const missingDependencies = await getModulesWithDeps([optimizedBranch]);
                await this._processModules(missingDependencies);
            } else {
                // ToDo: describe it
                const injectableDecorator = (constructor: Function) => {
                    if (!this.registry.find(m => m.manifest.name == manifest.name && m.manifest.branch == manifest.branch && m.manifest.version == manifest.version)) {
                        this.registry.push({
                            manifest: manifest,
                            clazz: constructor,
                            instance: null,
                            order: order,
                            contextIds: contextIds
                        });
                    }
                };

                // ToDo: describe it
                const injectDecorator = (name: string) => (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                    descriptor = descriptor || {};
                    descriptor.get = () => {
                        // ToDo: Fix error "TypeError: Cannot read property 'instance' of undefined"
                        const versions = this.registry.filter(m => m.manifest.name == name).map(m => m.manifest.version);
                        const dependency = manifest.dependencies[name];

                        // ToDo: Should be moved to the background? 
                        // ToDo: Fetch prefix from global settings.
                        // ToDo: Replace '>=' to '^'
                        const prefix = '>='; // https://devhints.io/semver
                        const range = prefix + (typeof dependency === "string" ? dependency : dependency[DEFAULT_BRANCH_NAME]);

                        const maxVer = maxSatisfying(versions, range);

                        return this.registry.find(m => m.manifest.name == name && m.manifest.version == maxVer).instance;
                    }
                    return descriptor;
                };

                execScript(coreWrapper, SubscribeOptions, injectDecorator, injectableDecorator);
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

        extension.extension.sendMessage({
            type: isActive ? "CONTEXT_STARTED" : "CONTEXT_FINISHED",
            payload: { contextIds }
        });
    }
}