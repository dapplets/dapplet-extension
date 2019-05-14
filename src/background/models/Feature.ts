import Base from './Base';

export default class Feature extends Base {
    getId = () => this.id;
    
    id: string = null;
    featureFamilyId: string = null;
    name: string = null;
    description: string = null;
    author: string = null;
    version: string = null;
    icon: string = null;
    adapterId: string = null;
    
    //hasUpdate: boolean = null;
    //isActive: boolean = null;
}