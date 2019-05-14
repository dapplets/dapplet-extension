export default class DappletRegistry {

    async getLastInjectorsByHostname(hostname: string): Promise<string[]> {
        return new Promise(function (resolve, reject) {
            chrome.runtime.getPackageDirectoryEntry(function (de) {
                de.getDirectory("examples/injectors/" + hostname + "/", {}, function (
                    deHostname
                ) {
                    const reader = deHostname.createReader();
                    reader.readEntries(function (files) {
                        const urls = files.map(
                            x => "/examples/injectors/" + hostname + "/" + x.name
                        );
                        resolve(urls);
                    }, reject);
                }, reject);
            });
        });
    }

    // swarm | ipfs
    async getInjectorByUrl(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Can not load remote injector");
        const buffer = await response.arrayBuffer();
        return buffer;
    };
}