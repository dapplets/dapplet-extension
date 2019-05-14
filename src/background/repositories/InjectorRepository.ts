import BaseRepository from './BaseRepository'
import Injector from '../models/Injector'

export default class InjectorRepository extends BaseRepository<Injector> { 
    constructor() {
        super(Injector);
    }
}