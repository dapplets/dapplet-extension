export default class FeatureDTO {    
    id: string = null;
    featureFamilyId: string = null;
    name: string = null;
    description: string = null;
    author: string = null;
    version: string = null;
    icon: string = null;
    lastFeatureId: string = null;
    isNew: boolean = null;
    isActive: boolean = null;
    isDev?: boolean = null; // only for dev scripts
    devUrl?: string = null; // only for dev scripts
}