const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    'dapplets/test-common-dapplet/build/index': path.join(
      __dirname,
      'dapplets/test-common-dapplet/src/index.ts'
    ),
    'dapplets/test-dynamic-dapplet/build/index': path.join(
      __dirname,
      'dapplets/test-dynamic-dapplet/src/index.ts'
    ),
    'dapplets/twitter-demo/build/index': path.join(__dirname, 'dapplets/twitter-demo/src/index.ts'),
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
    static: './',
  },
}
