const path = require('path')

const DAPPLETS = [
  'test-common-dapplet',
  'test-dynamic-dapplet',
  'twitter-demo',
  'test-alerts-dapplet',
]

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: Object.fromEntries(
    DAPPLETS.map((name) => [
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
  },
}
