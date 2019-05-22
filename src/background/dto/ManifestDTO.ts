export default class ManifestDTO {    
    id: string = null;
    type: string = null;
    familyId: string = null;
    name: string = null;
    description: string = null;
    author: string = null;
    version: string = null;
    icon: string = null;
    lastFeatureId: string = null; // ToDo: Unused yet. Implement opportunity to update feature via popup
    isNew: boolean = null; // ToDo: Unused yet. Mark label "NEW" in popup list
    isActive: boolean = null;
    isDev?: boolean = null; // only for dev scripts
    devUrl?: string = null; // only for dev scripts

    // ToDo: Add "hasUpdate", which are used in FeatureList.tsx
}