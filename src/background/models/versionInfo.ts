import Base from '../../common/models/base';
import { StorageRef } from '../registries/registry';

export default class VersionInfo extends Base {
    getId = () => this.dist.hash;

    branch: string = null;
    version: string = null;
    dist: StorageRef = null;
    dependencies: { name: string, version: string }[] = [];
}