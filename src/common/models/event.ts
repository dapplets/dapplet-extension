import Base from '../../common/models/base';

export class Event extends Base {
    getId = () => this.id;
    id: string;
    title: string;
    description: string;
    created: Date;
}