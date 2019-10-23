import Base from './base';

export enum DappletCompatibility {
    INCOMPTAIBLE = 0,
    LEGACY_COMPATIBLE = 1,
    FRAMES_COMPATIBLE = 2
}

export class GlobalConfig extends Base {
    getId = () => this.id;

    id: string = 'default';

    registryUrl: string = null;

    suspended: boolean = false;

    dappletCompatibility: DappletCompatibility = null;
}