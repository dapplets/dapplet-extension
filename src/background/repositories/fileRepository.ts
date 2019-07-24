import BaseRepository from './baseRepository'
import File from '../models/file'

export default class FileRepository extends BaseRepository<File> { 
    constructor() {
        super(File);
    }
}