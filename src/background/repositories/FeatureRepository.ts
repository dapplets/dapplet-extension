import BaseRepository from './BaseRepository'
import Feature from '../models/Feature'

export default class FeatureRepository extends BaseRepository<Feature> { 
    constructor() {
        super(Feature);
    }
}