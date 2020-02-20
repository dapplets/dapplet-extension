import BaseBrowserStorage from './baseBrowserStorage'
import File from '../models/file'

export default class FileBrowserStorage extends BaseBrowserStorage<File> { 
    constructor() {
        super(File, 'File');
    }
}