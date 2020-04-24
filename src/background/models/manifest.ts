import Base from '../../common/models/base';
import { ModuleTypes } from '../../common/constants';
import { HashUris } from '../registries/registry';

export default class Manifest extends Base {
    getId = () => `${this.name}#${this.branch}@${this.version}`;

    name: string = null;
    branch: string = null;
    version: string = null;
    type: ModuleTypes = null;
    title: string = null;
    description: string = null;
    author: string = null;
    icon: string = null;
    dist: HashUris | string = null;

    dependencies: {
        [name: string]: string | {
            [branch: string]: string
        }
    }
}