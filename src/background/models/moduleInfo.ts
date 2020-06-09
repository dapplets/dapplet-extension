import Base from '../../common/models/base';
import { ModuleTypes } from '../../common/constants';
import { StorageRef } from '../registries/registry';

export default class ModuleInfo extends Base {
    getId = () => this.name;

    name: string = null;
    type: ModuleTypes = null;
    title: string = null;
    description: string = null;
    author: string = null;
    icon?: StorageRef = null;
}