import Api from "./api";
import Cache from "./cache";

class Service {
  static async getInjectorsByHostname(hostname) {
    const urls = await Api.getLastInjectorsByHostname(hostname);

    const injectors = await Promise.all(
      urls.map(async function(url) {
        let manifest = await Cache.getManifestByUrl(url);
        const iconPath = manifest.icons["128"];
        const iconBase64 = await Cache.getBase64FromPackage(url, iconPath);
        manifest.icons["128"] = "data:image/png;base64," + iconBase64;
        return manifest;
      })
    );

    return injectors;
  }
}

export default Service;
