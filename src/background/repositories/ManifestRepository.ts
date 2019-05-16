import BaseRepository from './BaseRepository'
import Manifest from '../models/Manifest'

export default class ManifestRepository extends BaseRepository<Manifest> { 
    constructor() {
        super(Manifest);
    }
}