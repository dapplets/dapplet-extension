import BaseRepository from './BaseRepository'
import SiteConfig from '../models/SiteConfig'

export default class SiteConfigRepository extends BaseRepository<SiteConfig> { 
    constructor() {
        super(SiteConfig);
    }
}