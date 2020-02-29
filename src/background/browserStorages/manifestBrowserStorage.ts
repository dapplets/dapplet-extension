import BaseBrowserStorage from './baseBrowserStorage'
import Manifest from '../models/manifest'

export default class ManifestBrowserStorage extends BaseBrowserStorage<Manifest> { 
    constructor() {
        super(Manifest, 'Manifest');
    }
}