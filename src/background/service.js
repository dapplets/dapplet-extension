import Api from "./api";
import Cache from "./cache";

class Service {
  static async getInjectorsByHostname(hostname) {
    const urls = await Api.getLastInjectorsByHostname(hostname);
    let promises = urls.map(url => Cache.getManifestByUrl(url));
    const injectors = await Promise.all(promises);
    return injectors;
  }
}

export default Service;
