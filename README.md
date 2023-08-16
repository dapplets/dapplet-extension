![dapplet-extension-1](https://user-images.githubusercontent.com/51093278/183035137-47c85142-7d10-47f4-b0c7-4a2ee2f67a15.png)

# Dapplet Browser Extension

Dapplets Extension is a part of web infrastructure for running decentralized applications on top of other people's websites. Using Dapplets Extension, a user gets access to web3 functionality within the framework of familiar web2-sites. Community-developed dapplets run on sites like Twitter, Youtube, Github, extending their functionality by introducing mechanisms for use and sharing tokens between users.

These dapplets are stored in decentralized repositories and are unstoppable - no one can remove or disable them, and no one can stop you from running dapplets in a browser.

Dapplets provide tools to decentralize business processes and enable developers to provide access to new services in places where it was not possible before.

## Downloads

[Dapplets Extension](https://chrome.google.com/webstore/detail/dapplets/pjjnaojpjhgbhpfffnjleidmdbajagdj) - Google Extension Store

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
    contentscript/
    manifest.json
  utils/
```

- `build` - Build bundles
- `dist` - Releases
- `resources` - The static files which is copying to `build` directory as is
- `src` - Main projects (the product code)
- `src\backgorund` - Background service of extension. It works globally in browser
- `src\contentscript` - These scripts are running in the context of each viewing webpage
- `src\manifest.json` - The manifest of browser extension
- `utils` - Utils for project building

### Building

1.  Clone repo
2.  `npm install`
3.  `npm start` to run the dev task in watch mode or `npm run dev` to compile once or `npm run build` to build a production (minified) version

## Built With

- [React](https://reactjs.org/) - The web framework used

## Authors

- **Dmitry Palchun** - _Initial work_ - [ethernian](https://github.com/ethernian)
- **Alexander Sakhaev** - _Initial work_ - [alsakhaev](https://github.com/alsakhaev)
