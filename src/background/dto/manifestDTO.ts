import { ModuleTypes } from '../../common/constants';

export default class ManifestDTO {
    name: string = null;
    branch: string = null;
    version: string = null;
    type: ModuleTypes = null;
    title: string = null;
    description: string = null;
    author: string = null;
    icon: {
        hash: string;
        uris: string[];
    } = null;
    isActive: boolean = null;
    dist: string = null;
    order: number = null;
    hostnames: string[] = [];
    sourceRegistry: {
        url: string;
        isDev: boolean;
    } = null;
    // ToDo: Add "hasUpdate", which are used in Features.tsx
}