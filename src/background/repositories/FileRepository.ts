import BaseRepository from './BaseRepository'
import File from '../models/File'

export default class FileRepository extends BaseRepository<File> { 
    constructor() {
        super(File);
    }
}