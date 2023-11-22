const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const package = require('./package.json')
const webpack = require('webpack')

function modifyManifest(buffer) {
  const manifest = JSON.parse(buffer.toString())

  manifest.version = package.version.replace(/-.*/gm, '')
  manifest.version_name = package.version
  manifest.description = package.description
  manifest.author = package.author

  manifest_JSON = JSON.stringify(manifest, null, 2)
  return manifest_JSON
}

function handleInsertStyles(element) {
  // ToDo: the same function is in common/helpers.ts
  const isE2ETestingEnvironment = (win) => {
    // ToDo: find another way to determine Cypress - ???????? - is it needed for PlayWright?

    try {
      // Reading of href can throw Error when cross-origin
      const href = win.location.href

      if (href.indexOf('specs') !== -1) return true
      if (href.indexOf('localhost:55618') !== -1) return true

      return false
    } catch (_) {
      return false
    }
  }

  // The similar code is in contentscript/index.ts
  const IS_OVERLAY_IFRAME = window.name.indexOf('dapplet-overlay') !== -1
  const IS_E2E_ENV = isE2ETestingEnvironment(window)
  if (IS_OVERLAY_IFRAME || IS_E2E_ENV) return

  const extensionHostID = 'dapplets-overlay-manager'
  let extensionHost = document.getElementById(extensionHostID)

  if (!extensionHost) {
    const CollapsedOverlayClass = 'dapplets-overlay-collapsed'
    const HiddenOverlayClass = 'dapplets-overlay-hidden'
    const DappletsOverlayManagerClass = 'dapplets-overlay-manager'
    const OverlayFrameClass = 'dapplets-overlay-frame'

    const panel = document.createElement(DappletsOverlayManagerClass)
    panel.id = 'dapplets-overlay-manager'
    panel.classList.add(OverlayFrameClass, CollapsedOverlayClass, HiddenOverlayClass)

    panel.attachShadow({ mode: 'open' })

    const container = document.createElement('div')
    container.id = 'app'

    // Add style tag to shadow host
    panel.shadowRoot.appendChild(element)
    panel.shadowRoot.appendChild(container)
    document.body.appendChild(panel)
  } else {
    extensionHost.shadowRoot.appendChild(element)
  }
}

module.exports = {
  entry: {
    'service-worker': path.join(__dirname, 'src/background/index.ts'),
    contentscript: path.join(__dirname, 'src/contentscript/index.ts'),
    inpage: path.join(__dirname, 'src/inpage/index.ts'),
    worker: path.join(__dirname, 'src/worker/index.ts'),
    sandbox: path.join(__dirname, 'src/sandbox/index.ts'),
    offscreen: path.join(__dirname, 'src/offscreen/index.ts'),
    popup: path.join(__dirname, 'src/popup/index.tsx'),
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js',
    publicPath: '',
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
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              insert: handleInsertStyles,
            },
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: (resourcePath) => resourcePath.endsWith('.module.scss'),
              },
            },
          },
          'sass-loader',
        ],
        include: path.resolve(__dirname, 'src/contentscript'),
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        include: [path.resolve(__dirname, 'src'), /node_modules/],
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.eot$/, /\.ttf$/, /\.woff$/, /\.woff2$/],
        type: 'asset/inline',
      },
      {
        test: /\.svg$/,
        oneOf: [
          {
            issuer: /\.tsx$/,
            use: ['@svgr/webpack', 'url-loader'],
          },
          {
            type: 'asset/inline',
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      crypto: false,
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert-browserify'),
      http: false,
      https: false,
      zlib: false,
      'process/browser': false,
    },
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        'resources',
        {
          from: 'manifest.json',
          to: 'manifest.json',
          transform: (content) => modifyManifest(content),
        },
        {
          from: 'src/offscreen/index.html',
          to: 'offscreen.html',
        },
        {
          from: 'src/sandbox/index.html',
          to: 'sandbox.html',
        },
        {
          from: 'src/popup/index.html',
          to: 'popup.html',
        },
      ],
    }),
    new webpack.DefinePlugin({
      EXTENSION_VERSION: JSON.stringify(package.version),
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new ForkTsCheckerWebpackPlugin(),
  ],
}
