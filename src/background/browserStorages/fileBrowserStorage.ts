import File from '../models/file'
import BaseBrowserStorage from './baseBrowserStorage'

export default class FileBrowserStorage extends BaseBrowserStorage<File> {
  constructor() {
    super(File, 'File')
  }
}
