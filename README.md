# Dapplet Browser Extension

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Solution Structure

```
$/
  build/
  dist/
  resources/
  src/
    background/
    inpage/
    options/
    popup/
    manifest.json
  utils/
```

- `build` - Build bundles
- `dist` - Releases
- `resources` - The static files which is copying to `build` directory as is
- `src` - Main projects (the product code)
- `src\backgorund` - Background service of extension. It works globally in browser
- `src\inpage` - These scripts are running in the context of each viewing webpage
- `src\options` - The settings page. It's available in browser's settings => extensions => Injector Extension => options
- `src\popup` - The popup window that is displayed when extension icon is clicked
- `src\manifest.json` - The manifest of browser extension
- `utils` - Utils for project building 

### Building

1.  Clone repo
2.  `npm install`
3.  `npm start` to run the dev task in watch mode or `npm run dev` to compile once or `npm run build` to build a production (minified) version

## Built With

* [React](https://reactjs.org/) - The web framework used
* [Material UI](https://material-ui.com/) - React components that implement Google's Material Design

## Authors

* **Dmitry Palchun** - *Initial work* - [ethernian](https://github.com/ethernian)
* **Alexander Sakhaev** - *Initial work* - [alsakhaev](https://github.com/alsakhaev)

## Screenshots

### Features List

![](docs/images/ext-screenshot-features.png)

### Development Mode

![](docs/images/ext-screenshot-dev.png)
