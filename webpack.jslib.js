const { ConcatSource } = require('webpack-sources');
const TerserPlugin = require("terser-webpack-plugin");

class RemoveUseStrictPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('RemoveUseStrictPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'RemoveUseStrictPlugin',
                    stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
                },
                (assets) => Object.keys(assets).forEach((fileName) => {
                    let result = compilation.assets[fileName].source();
                    result = result.replace(/use strict/g, '');
                    compilation.assets[fileName] = new ConcatSource(result);
                })
            );
        })
    }
}

const config = {
  mode: 'production',
  entry: __dirname + '/jslib/index.js',
  //devtool: 'inline-source-map',
  output: {
    path: __dirname + '/lib',
    filename: 'index.min.js',
    library: 'index',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: "typeof self !== 'undefined' ? self : this"
  },
  plugins: [
    new RemoveUseStrictPlugin()
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false
      }),
    ],
  }
};

module.exports = config;