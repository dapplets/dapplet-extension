const path = require('path')
const fs = require('fs')

const dapplets = fs.readdirSync(path.join(__dirname, 'dapplets'))

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: Object.fromEntries(
    dapplets.map((name) => [
      `dapplets/${name}/build/index`,
      path.join(__dirname, `dapplets/${name}/src/index.ts`),
    ])
  ),
  output: {
    path: __dirname,
    filename: '[name].js',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: 'ts-loader',
      },
      {
        test: /\.(png|jp(e*)g|svg|html)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 50 * 1024, // Convert images < 50kb to base64 strings
            },
          },
        ],
      },
    ],
  },
  devServer: {
    port: 3000,
    hot: false,
    liveReload: false,
    static: './',
    webSocketServer: false,
  },
}
