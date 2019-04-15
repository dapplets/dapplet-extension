class Api {
  // contract
  static getLastInjectorsByHostname(hostname) {
    return new Promise(function(resolve, reject) {
      chrome.runtime.getPackageDirectoryEntry(function(de) {
        de.getDirectory("resources/injectors/" + hostname + "/", {}, function(
          deHostname
        ) {
          const reader = deHostname.createReader();
          reader.readEntries(function(files) {
            const urls = files.map(
              x => "/resources/injectors/" + hostname + "/" + x.name
            );
            resolve(urls);
          });
        });
      });
    });
  }

  // swarm | ipfs
  static async getInjectorByUrl(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Can not load remote injector");
    const buffer = await response.arrayBuffer();
    return buffer;
  }
}

export default Api;
