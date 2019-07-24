import BaseRepository from './baseRepository'
import Manifest from '../models/manifest'

export default class ManifestRepository extends BaseRepository<Manifest> { 
    constructor() {
        super(Manifest);
    }
}