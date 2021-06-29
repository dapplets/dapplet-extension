const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const package = require('./package.json');
const webpack = require("webpack");

function modifyManifest(buffer) {
  const manifest = JSON.parse(buffer.toString());

  manifest.version = package.version.replace(/-.*/gm, '');
  manifest.version_name = package.version;
  manifest.description = package.description;
  manifest.author = package.author;

  manifest_JSON = JSON.stringify(manifest, null, 2);
  return manifest_JSON;
}

module.exports = {
  entry: {
    popup: path.join(__dirname, "src/popup/index.tsx"),
    background: path.join(__dirname, "src/background/index.ts"),
    inpage: path.join(__dirname, "src/inpage/index.ts"),
    pairing: path.join(__dirname, "src/pairing/index.tsx"),
    sowa: path.join(__dirname, "src/sowa/index.tsx"),
    deploy: path.join(__dirname, "src/deploy/index.tsx"),
    starter: path.join(__dirname, "src/starter/index.tsx"),
    settings: path.join(__dirname, "src/settings/index.tsx"),
    login: path.join(__dirname, "src/login/index.tsx"),
    welcome: path.join(__dirname, "src/welcome/index.tsx"),
    guide: path.join(__dirname, "src/guide/index.tsx")
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        include: path.resolve(__dirname, 'src'),
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        include: path.resolve(__dirname, 'src'),
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader" // Creates style nodes from JS strings
          },
          {
            loader: "css-loader" // Translates CSS into CommonJS
          },
          {
            loader: "sass-loader" // Compiles Sass to CSS
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'resolve-url-loader'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
        loader: "url-loader",
        include: path.resolve(__dirname, 'src'),
        options: {
          limit: 10000,
          name: "static/[name].[hash:8].[ext]",
        },
      },
      {
        test: [/\.eot$/, /\.ttf$/, /\.woff$/, /\.woff2$/],
        loader: "file-loader",
        include: path.resolve(__dirname, 'src'),
        options: {
          name: "static/[name].[hash:8].[ext]",
        },
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      "crypto": false,
      "stream": require.resolve('stream-browserify'),
      "assert": require.resolve('assert-browserify'),
      "http": false,
      "https": false,
      "zlib": false
    }
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        "resources",
        {
          from: "manifest.json",
          to: "manifest.json",
          transform: (content, path) => modifyManifest(content)
        },
        {
          from: "src/background/index.html",
          to: "background.html"
        }, {
          from: "src/popup/index.html",
          to: "popup.html"
        }, {
          from: "src/options/index.html",
          to: "options.html"
        }, {
          from: "src/pairing/index.html",
          to: "pairing.html"
        }, {
          from: "src/sowa/index.html",
          to: "sowa.html"
        }, {
          from: "src/deploy/index.html",
          to: "deploy.html"
        }, {
          from: "src/starter/index.html",
          to: "starter.html"
        }, {
          from: "src/settings/index.html",
          to: "settings.html"
        }, {
          from: "src/login/index.html",
          to: "login.html"
        }, {
          from: "src/callback/index.html",
          to: "callback.html"
        }, {
          from: "src/welcome/index.html",
          to: "welcome.html"
        }, {
          from: "src/guide/index.html",
          to: "guide.html"
        }
      ]
    }),
    new webpack.DefinePlugin({
      EXTENSION_VERSION: JSON.stringify(package.version)
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    new ForkTsCheckerWebpackPlugin()
  ]
};
