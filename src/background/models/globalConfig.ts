import Base from './base';

export default class GlobalConfig extends Base {
    getId = () => this.id;

    id: string = 'default';

    devConfigUrl: string = null;

    suspended: boolean = false;
}