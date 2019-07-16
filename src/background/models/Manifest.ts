import Base from './Base';

export default class Manifest extends Base {
    getId = () => this.id;
    
    id: string = null;
    type: string = null;
    familyId: string = null; // ToDo: delete
    name: string = null;
    description: string = null;
    author: string = null;
    version: string = null;
    icon: string = null;
    isDev?: boolean = null; // only for dev scripts
    dist: string = null;
    title?: string = null;
}