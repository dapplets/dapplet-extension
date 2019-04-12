class Api {
  // contract
  static async getLastInjectorsByHostname(hostname) {
    switch (hostname) {
      case "twitter.com":
        return [
          "/resources/injectors/twitter-wc-dapplet.zip",
          "/resources/injectors/twitter-wc-dapplet-1.zip",
          "/resources/injectors/twitter-wc-dapplet-2.zip",
          "/resources/injectors/twitter-wc-dapplet-3.zip",
          "/resources/injectors/twitter-wc-dapplet-4.zip"
        ];
      default:
        return [];
    }
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
