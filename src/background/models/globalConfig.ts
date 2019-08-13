import Base from './base';

export default class GlobalConfig extends Base {
    getId = () => this.id;

    id: string = 'default';

    registryUrl: string = null;

    suspended: boolean = false;
}