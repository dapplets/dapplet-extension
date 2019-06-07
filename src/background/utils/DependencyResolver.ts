import NameResolver from '../utils/NameResolver';
import ScriptLoader from '../utils/ScriptLoader';

export default class DependencyResolver {

    constructor(private _nameResolver: NameResolver, private _scriptLoader: ScriptLoader) {

    }
    

    public async resolve(modules: { name: string, version: string }[]): Promise<{ name: string, version: string }[]> {

        // ToDo: Add dependency optimizer
        // Search for the following topics: 
        // 1. Topological Sorting
        // 2. Dependency Resolution Algorithm

        let dependencies = [...modules];

        for (let i = 0; i < dependencies.length; i++) {
            const parent = dependencies[i];
            const moduleDeps = await this._getChildDependencies(parent.name, parent.version);
            for (const dep of moduleDeps) {
                if (!dependencies.find(d => d.name == dep.name && d.version == dep.version)) {
                    dependencies.push(dep);
                }
            }
        }

        // reverse() - the lowest script in the hierarchy should be loaded first
        return dependencies.reverse();
    }

    private async _getChildDependencies(name: string, version: string): Promise<{ name: string, version: string }[]> {

        const uri = await this._nameResolver.resolve(name, version);
        const script = await this._scriptLoader.load(uri);

        const execScript = new Function('Load', 'PublicName', script);

        const dependencies: { name: string, version: string }[] = [];

        function loadDecorator(name: string, version: string): Function {
            dependencies.push({ name, version });
            return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
                return;
            };
        }

        let publicName: { name: string, version: string } = null;

        function publicNameDecorator(name: string, version: string): Function {
            publicName = { name, version };
            return (target: Function) => {
                return;
            }
        }

        const result = execScript(loadDecorator, publicNameDecorator);

        if (!publicName || publicName.name != name || publicName.version != version) {
            console.error('Invalid PublicName');
            return [];
        }

        return dependencies;
    }
}