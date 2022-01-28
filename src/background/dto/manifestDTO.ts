import { ModuleTypes } from '../../common/constants';
import { StorageRef } from '../registries/registry';

export default class ManifestDTO {
    name: string = null;
    //branch: string = null;
    //version: string = null;
    type: ModuleTypes = null;
    title: string = null;
    description: string = null;
    author: string = null;
    icon: StorageRef = null;
    isActive: boolean = null;
    isActionHandler: boolean = null;
    isHomeHandler: boolean = null;
    activeVersion?: string | null = null;
    lastVersion?: string | null = null;
    //dist: string = null;
    order: number = null;
    hostnames: string[] = [];
    sourceRegistry: {
        url: string;
        isDev: boolean;
    } = null;
    // ToDo: Add "hasUpdate", which are used in Features.tsx
    available: boolean;
    isUnderConstruction: boolean;
    isMyDapplet: boolean;
}