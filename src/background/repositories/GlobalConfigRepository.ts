import BaseRepository from './BaseRepository'
import GlobalConfig from '../models/GlobalConfig'

export default class GlobalConfigRepository extends BaseRepository<GlobalConfig> { 
    constructor() {
        super(GlobalConfig);
    }
}