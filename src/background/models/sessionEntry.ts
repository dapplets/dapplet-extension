import Base from '../../common/models/base';

export default class SessionEntry extends Base {
    getId = () => this.sessionId + '/' + this.key;

    sessionId: string = null;
    key: string = null;
    value: any = null;
}