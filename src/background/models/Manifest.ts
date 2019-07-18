import Base from './Base';
import { ModuleTypes } from '../../common/constants'; 

export default class Manifest extends Base {
    getId = () => this.id;
    
    id: string = null;
    type: ModuleTypes = null;
    familyId: string = null; // ToDo: delete
    name: string = null;
    branch: string = null;
    description: string = null;
    author: string = null;
    version: string = null;
    icon: string = null;
    isDev?: boolean = null; // only for dev scripts
    dist: string = null;
    title?: string = null;

    dependencies: {
        [name: string]: string | {
            [branch: string]: string
        }
    }
}