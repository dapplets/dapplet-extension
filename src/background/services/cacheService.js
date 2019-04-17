import Storage from "../../utils/chrome-extension-storage-wrapper";
import JSZip from "jszip";
import * as Api from "./apiService";

const bufferToString = buf => {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
};

const stringToBuffer = str => {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

const getFileByUrl = async url => {
  const cached = await Storage.getLocal("cache:" + url);
  if (cached) {
    console.log("Return cached " + url);
    const cachedBuffer = stringToBuffer(cached);
    return cachedBuffer;
  }

  console.log("Fetching " + url);
  const buffer = await Api.getInjectorByUrl(url);
  const stringifiedBuffer = bufferToString(buffer);

  await Storage.setLocal("cache:" + url, stringifiedBuffer);

  return buffer;
};

const getBase64FromPackage = async (url, path) => {
  const zipBuffer = await getFileByUrl(url);
  const zip = await JSZip.loadAsync(zipBuffer);
  const base64 = await zip.file(path).async("base64");
  return base64;
};

const getScriptByUrl = async url => {
  const buffer = await getFileByUrl(url);
  const zip = await JSZip.loadAsync(buffer);
  const json = await zip.file("manifest.json").async("string");
  const manifest = JSON.parse(json);
  const filename = manifest.script;
  const script = await zip.file(filename).async("string");
  return script;
};

const getManifestByUrl = async url => {
  const buffer = await getFileByUrl(url);
  const zip = await JSZip.loadAsync(buffer);
  const json = await zip.file("manifest.json").async("string");
  let manifest = JSON.parse(json);
  manifest.url = url;
  return manifest;
};

export {
  getBase64FromPackage,
  getScriptByUrl,
  getManifestByUrl,
  getFileByUrl,
  bufferToString,
  stringToBuffer
};
