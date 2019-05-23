import { initBGFunctions } from "chrome-extension-message-wrapper";
import Core from './Core'

export default class Injector {
    private _features: any[] = []
    private _scripts: { id: string, class: any, instance: any }[] = []

    async init() {
        //let dependencies: { target: any, propertyKey: any, id: string }[] = [];
        let dependencies: { target?: any, propertyKey?: any, id: string, clazz?: any }[] = [];

        function Load(id: string): Function {
            console.log("decorator called ID:", id)
            return async (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                const dep = { target, propertyKey, id };
                dependencies.push(dep);
                console.log('dependency pushed#1 - v1', dep);
                Object.defineProperty(target, propertyKey, {
                    writable: true,
                });
                target[propertyKey] = await getOrNewObject(id);
                console.log('*******> dependency INJECTED - v1', target, propertyKey,target[propertyKey]);

            };
        }

        const {
            getActiveFeatureIdsByHostname,
            getSuspendityByHostname,
            getSuspendityEverywhere,
            getScriptById
        } = await initBGFunctions(chrome);

        const hostname = window.location.hostname;

        async function loadClass(userScriptId: string): Promise<any> {
            console.log('*** START loading class', userScriptId, requrseLevel);
            const userScriptText = await getScriptById(userScriptId);
            console.log('*** before eval class', userScriptId, requrseLevel);
            const clazz = eval("(function(){ " + userScriptText + " return Feature; })();");
            console.log('*** END loading class', userScriptId), requrseLevel;
            //const obj = new clazz();
            return clazz;
        }

        let objectCache: {[key:string]:string} = {};
        let requrseLevel = 0;
        let marker = 1000; // mark group of execution points belonging together.
        async function getOrNewObject(id:string): Promise<any>{
            //return objectCache[id] || (objectCache[id] = new (await loadClass(id)));  
            if (!objectCache[id]) {
                let M = marker++;
                console.log("********* starting loading class for new instance > ", id, M, requrseLevel++);
                let clazz = await loadClass(id);
                console.log("********* class loaded. creating new instance > ", id, M, requrseLevel);
                objectCache[id] = new clazz(); 
                let obj:any = objectCache[id];
                console.log("********* created instance> ", id, objectCache[id], obj.library, --requrseLevel);
            }
            return objectCache[id];
        }

        console.log("=START================");
        const loadingIds = await getActiveFeatureIdsByHostname(hostname);
        for (const userScriptId of loadingIds) {
            let clazz = await loadClass(userScriptId);
            const dep = { id: userScriptId; clazz: clazz };
            dependencies.push(dep);
            console.log('dependency pushed#2', dep);
        }

        const objects = {};
        const loadedDeps = [];
        for (const dep of dependencies) {
            console.log('dep.id', dep.id, dependencies);
            let obj = await getOrNewObject(dep.id);
            if (dep.target) {
                dep.target[dep.propertyKey] = obj;
            }
            loadedDeps.push(obj);
        }

        for (const featureId of loadingIds) {
            objects[featureId].activate();
        }

        console.log("objectCache>", objectCache)


        // for (const featureId of activeFeatureIds) {
        //     const featureText = await getScriptById(featureId);
        //     const Feature = eval("(function(){ " + featureText + " return Feature; })();");

        //     this._features.push(Feature);
        // }

        // for (const dep of dependencies) {
        //     let found = this._scripts.filter(s => s.id == dep.id)[0];

        //     if (!found) {
        //         const script = await getScriptById(dep.id);
        //         if (!script) {
        //             console.error(`Script ${dep.id} is not found`);
        //             continue;
        //         }

        //         const Class = eval("(function(){ " + script + " return ContentAdapter; })();");

        //         found = {
        //             id: dep.id,
        //             class: Class,
        //             instance: new Class()
        //         };

        //         this._scripts.push(found);
        //     }

        //     dep.target[dep.propertyKey] = found.instance;
        // }

        // for (const Feature of this._features) {
        //     const featureInstance = new Feature();
        //     console.log('featureInstance', featureInstance);
        //     featureInstance.activate();
        // }
    }

    // #region 
    // async init() {
    //     var backgroundFunctions = await initBGFunctions(chrome);
    //     const {
    //         getActiveFeatureIdsByHostname,
    //         getSuspendityByHostname,
    //         getSuspendityEverywhere,
    //         getFeatureScriptById,
    //         getAdapterScriptById
    //     } = backgroundFunctions;
    //     var me = this;

    //     var dependencies = [];

    //     // ToDo: implement
    //     var Load = (id: string): Function => {
    //         console.log('-- !decorator factory invoked! --', id);
    //         return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
    //             console.log('decorator before load');
    //             console.log('decorator target', target);
    //             console.log('decorator propertyKey', propertyKey);
    //             console.log('decorator descriptor', descriptor);

    //             dependencies.push({
    //                 target, propertyKey, id
    //             });
    //         };
    //     }

    //     const hostname = window.location.hostname;

    //     // ToDo: merge into one checking
    //     const isBlockedEverywhere = await getSuspendityEverywhere();
    //     const isBlockedHostname = await getSuspendityByHostname(hostname);

    //     if (isBlockedEverywhere) {
    //         console.warn("Injecting is suspended globally at every website.");
    //         return;
    //     }

    //     if (isBlockedHostname) {
    //         console.warn("Current hostname is suspended for injecting.");
    //         return;
    //     }

    //     const activeFeatureIds = await getActiveFeatureIdsByHostname(hostname);

    //     if (activeFeatureIds == null || activeFeatureIds.length == 0) {
    //         console.warn("Dapplet Injector: Available injectors not found");
    //         return;
    //     }

    //     console.log("Found active features for " + hostname, activeFeatureIds);

    //     //for (const featureId of activeFeatureIds) {
    //     const featureId = activeFeatureIds[0];
    //     let featureText = await getFeatureScriptById(featureId);
    //     if (!featureText) {
    //         console.warn("Cannot load feature #" + featureId);
    //         //continue;
    //     }

    //     // ToDo: Check hash? Is it slow?
    //     // ToDo: Isolate eval here
    //     const Feature = eval(
    //         "(function(){ " + featureText + " return Feature; })();"
    //     );

    //     //console.log('gooo');
    //     //const featureInstance = new Feature();

    //     //console.log('featureInstance.adapter', featureInstance.adapter);
    //     // const adapterId =
    //     //   (Feature && Feature.REQUIRES && Feature.REQUIRES.adapter) || null;
    //     // let canLoadFeature = false;

    //     // // feature requires adapter and adapter is not yet loaded
    //     // if (
    //     //   adapterId &&
    //     //   me._adapters.filter(a => a.id == adapterId).length == 0
    //     // ) {
    //     //   const adapterText = await getAdapterScriptById(adapterId);
    //     //   if (!adapterText) {
    //     //     console.warn(`Cannot load adapter #${adapterId}. I'm skipping loading of feature #${featureId}`);
    //     //     continue;
    //     //   }
    //     //   const Adapter = eval(
    //     //     "(function(){ " + adapterText + " return ContentAdapter; })();"
    //     //   );
    //     //   me._adapters.push({
    //     //     id: adapterId,
    //     //     class: Adapter,
    //     //     instance: new Adapter()
    //     //   });
    //     //   canLoadFeature = true;
    //     // } else {
    //     //   canLoadFeature = true;
    //     // }

    //     // // TODO: fix canLoadFeature
    //     // if (canLoadFeature) {
    //     //   me._features.push({
    //     //     id: featureId,
    //     //     adapterId: adapterId,
    //     //     class: Feature,
    //     //     instance: new Feature()
    //     //   });
    //     // }
    //     //}

    //     console.log('dependencies', dependencies);

    //     for (const dep of dependencies) {
    //         const script = await getFeatureScriptById(dep.id);
    //         const Adapter = eval("(function(){ " + script + " return ContentAdapter; })();");
    //         dep.target[dep.propertyKey] = new Adapter();
    //     }

    //     const feature = new Feature();
    //     console.log('feature feature.adapter', feature.adapter);

    //     // if (me._features.length == 0) {
    //     //   console.warn("Dapplet Injector: Available features not found");
    //     //   return;
    //     // }

    //     // console.log(
    //     //   "Dapplet Injector: %s feature(s) was loaded",
    //     //   me._features.length
    //     // );
    //     // console.log(
    //     //   "Dapplet Injector: %s adapter(s) was loaded",
    //     //   me._adapters.length
    //     // );

    //     // const core = new Core();

    //     // for (const adapterInfo of me._adapters) {
    //     //   // ToDo: should we pass core as global variable instead init()?
    //     //   adapterInfo.instance.init(core, document);
    //     //   console.log("Dapplet Injector: Adapter %s inited", adapterInfo.id);

    //     //   for (const featureInfo of me._features.filter(
    //     //     f => f.adapterId == adapterInfo.id
    //     //   )) {
    //     //     adapterInfo.instance.registerFeature(featureInfo.instance);
    //     //     console.log("Dapplet Injector: Feature %s registered", featureInfo.id);
    //     //   }
    //     // }
    // }

    // async init2() {
    //     var x = 0;

    //     var deps = [];

    //     function load(id): Function {
    //         console.log("loaded: " + id);
    //         return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
    //             console.log("f(): called");
    //             console.log("target: ", target);
    //             console.log("propertyKey: ", propertyKey);
    //             console.log("descriptor: ", descriptor);
    //             //target[propertyKey] = new Adapter(id)
    //             // x++;
    //             // console.log('dec',x);
    //             //target[propertyKey] = id;

    //             deps.push({
    //                 target, propertyKey, id
    //             });
    //         }
    //     }

    //     const MyClass = eval(`(function(){
    //   var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    //     var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    //     if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    //     else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    //     return c > 3 && r && Object.defineProperty(target, key, r), r;
    //   };
    //   var MyClass = /** @class */ (function () {
    //       function MyClass() {
    //           console.log('constr', this.x);
    //       }
    //       MyClass.prototype.getX = function () {
    //           return this.x;
    //       };
    //       MyClass.prototype.getY = function () {
    //           return this.y;
    //       };
    //       __decorate([
    //           load('TwitterAdapter')
    //       ], MyClass.prototype, "x", void 0);
    //       __decorate([
    //           load('TwitterAdapter2')
    //       ], MyClass.prototype, "y", void 0);
    //       return MyClass;
    //   }());

    //   return MyClass;
    // })();`);

    //     for (const dep of deps) {
    //         dep.target[dep.propertyKey] = dep.id
    //     }

    //     const one = new MyClass()
    //     const two = new MyClass()


    //     console.log('one.getX()', one.getX());
    //     console.log('one.getY()', one.getY());
    //     console.log('two.getX()', two.getX());
    //     console.log('two.getY()', two.getY());

    // }

    //#endregion
}