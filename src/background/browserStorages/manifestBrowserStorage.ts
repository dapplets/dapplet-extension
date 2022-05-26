import Manifest from '../models/manifest'
import BaseBrowserStorage from './baseBrowserStorage'

export default class ManifestBrowserStorage extends BaseBrowserStorage<Manifest> {
  constructor() {
    super(Manifest, 'Manifest')
  }
}
