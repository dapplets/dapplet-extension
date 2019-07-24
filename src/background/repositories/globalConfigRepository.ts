import BaseRepository from './baseRepository'
import GlobalConfig from '../models/globalConfig'

export default class GlobalConfigRepository extends BaseRepository<GlobalConfig> { 
    constructor() {
        super(GlobalConfig);
    }
}