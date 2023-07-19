const path = require('path')

const BUILD_DIRECTORY = 'build'

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    'modules/test-common-dapplet/build/index': path.join(
      __dirname,
      'modules/test-common-dapplet/src/index.ts'
    ),
    'modules/test-dynamic-dapplet/build/index': path.join(
      __dirname,
      'modules/test-dynamic-dapplet/src/index.ts'
    ),
    'modules/twitter-demo/build/index': path.join(__dirname, 'modules/twitter-demo/src/index.ts'),
  },
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
    devMiddleware: {
      // publicPath: 'modules',
    },
    static: './',
  },
}
