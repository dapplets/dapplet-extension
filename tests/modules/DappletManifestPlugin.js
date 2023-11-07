const fs = require('fs')
const { RawSource } = require('webpack').sources
const { Compilation } = require('webpack')

/**
 * This plugin generates dapplet.json file with list of dapplets and adapters
 * located in ./dapplets and ./adapters folders. So you don't need to add
 * new test dapplets to dapplet.json manually. The file is generated in memory
 * and is not written to disk.
 */
class DappletManifestPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('DappletManifestPlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'DappletManifestPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        async () => {
          const dapplets = fs.readdirSync('./dapplets').map((x) => `./dapplets/${x}/dapplet.json`)
          const adapters = fs.readdirSync('./adapters').map((x) => `./adapters/${x}/dapplet.json`)
          const modules = [...dapplets, ...adapters]

          compilation.emitAsset('dapplet.json', new RawSource(JSON.stringify(modules, null, 2)))
        }
      )
    })
  }
}

exports.DappletManifestPlugin = DappletManifestPlugin
