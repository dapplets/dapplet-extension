import Storage from "../utils/chrome-extension-storage-wrapper";
import JSZip from "jszip";
import Api from "./api";

class Cache {

  static async getBase64FromPackage(url, path) {
    const zipBuffer = await this.getFileByUrl(url);
    const zip = await JSZip.loadAsync(zipBuffer);
    const base64 = await zip.file(path).async("base64");
    return base64;
  }

  static async getScriptByUrl(url) {
    const buffer = await this.getFileByUrl(url);
    const zip = await JSZip.loadAsync(buffer);
    const json = await zip.file("manifest.json").async("string");
    const manifest = JSON.parse(json);
    const filename = manifest.script;
    const script = await zip.file(filename).async("string");
    return script;
  }

  static async getManifestByUrl(url) {
    const buffer = await this.getFileByUrl(url);
    const zip = await JSZip.loadAsync(buffer);
    const json = await zip.file("manifest.json").async("string");
    let manifest = JSON.parse(json);
    manifest.url = url;
    return manifest;
  }

  static async getFileByUrl(url) {
    const cached = await Storage.getLocal("cache:" + url);
    if (cached) {
      console.log("Return cached " + url);
      const cachedBuffer = this.stringToBuffer(cached);
      return cachedBuffer;
    }

    console.log("Fetching " + url);
    const buffer = await Api.getInjectorByUrl(url);
    const stringifiedBuffer = this.bufferToString(buffer);

    await Storage.setLocal("cache:" + url, stringifiedBuffer);

    return buffer;
  }

  static bufferToString(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  static stringToBuffer(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
}

export default Cache;
