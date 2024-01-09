![dapplet-extension-1](/docs/images/dark_top.png#gh-dark-mode-only)
![dapplet-extension-1](/docs/images/light_top.png#gh-light-mode-only)

# Dapplet Browser Extension

Dapplets Extension is a part of web infrastructure for running decentralized applications on top of other people's websites. Using Dapplets Extension, a user gets access to web3 functionality within the framework of familiar web2-sites. Community-developed dapplets run on sites like Twitter, Youtube, Github, extending their functionality by introducing mechanisms for use and sharing tokens between users.

These dapplets are stored in decentralized repositories and are unstoppable - no one can remove or disable them, and no one can stop you from running dapplets in a browser.

Dapplets provide tools to decentralize business processes and enable developers to provide access to new services in places where it was not possible before.

## Downloads

[Dapplets Extension](https://chrome.google.com/webstore/detail/dapplets/pjjnaojpjhgbhpfffnjleidmdbajagdj) - Google Extension Store

## Features for Developers on the Dapplets Platform

### Adapters (Parser Configs)

Adapters allow a developer to embed dapplets into existing websites. Currently, adapters are available for the following websites: Twitter, GitHub, YouTube, Google Drive, and Google Search. Any developer can create an adapter and monetize their work in the future.

### Web page parsing

The platform provides a mechanism for parsing web pages using configuration JSON files with CSS and XPath queries, created by a community of adapter developers for different websites. Dapplet developers can immediately work with valuable data without worrying about the internals of web pages.

### Widgets embedding

The core platform contains embedded web components that can be inserted into any website. Each component is rendered inside the Shadow DOM. This approach provides strong isolation of styles from the styles of the context web page and prevents conflicts between them. The same components may look different on different websites. Component styling is handled by a community of adapter developers who create files with different CSS styles to make the design of components as similar as possible to the design of the context web page. The platform automatically loads the appropriate styles depending on the open website.

### Themes

Widgets can be styled according to the chosen theme on the context web page. This keeps the page styles consistent for embedded elements even on dark themes.

### Support for dynamic websites

Modern websites generate HTML page on the client side using JavaScript and AJAX to provide a better user experience. Thanks to the MutationObserver API, the platform core constantly monitors changes to such pages and automatically embeds widgets in dynamically created DOM elements.

### Overlay

A sliding sidebar in which dapplet developers can display complex web pages inside an isolated iframe. The platform provides an out-of-the-box way of two-way communication between overlay and dapplet (DappletBridge), which includes: function casting, shared state, and RxJS-based widget state binding.

### Virtual adapters

A dapplet developed for one site can be run on another site by implementing an adapter with the same interface. To do this, the dapplet must depend not on a specific adapter implementation, but on its abstraction - a virtual adapter (interface), respecting the principle of dependency inversion.

### Custom dapplet settings

The platform automatically generates an interface for editing dapplet settings for end users. For this purpose, a developer only needs to declare their parameters in JSON Schema format. The settings are also readable and writable via the Core API. The value store is isolated for different environments (development, testing, production), which allows you to parameterize, for example, the addresses of web services and smart contracts.

### Registry of modules on smart contracts

All modules (dapplets and adapters) are registered in smart contracts on the Ethereum blockchain. Module manifests (titles, descriptions, icon references, executable code references, and their hashes), dependencies between them, context IDs, ownership, and admin information are stored there. The extension checks downloaded files for integrity using hashing (Keccak-256) before downloading executable code.

### Decentralized repositories

Executable code of adapters and dapplets and their overlays are stored in different decentralized repositories: Ethereum Swarm and IPFS.

### NFT

The module developer receives an NFT token, which defines his right to own the module, at the moment of its publication in the registry. The token is implemented in accordance with the EIP-712 standard, which allows its use on trading platforms (e.g., OpenSea) and in cryptocurrency wallets. This opens up opportunities to buy/sell dapplets and adapters.

### Crypto-wallets and smart contracts

Built-in integration with NEAR and Ethereum wallets. User interfaces for connecting wallets and creating sessions are already implemented at the extension level. A user only needs to connect a wallet once, and different dapplets will be able to reuse that connection without complicating the UX.

### Notification system

Dapplets can send notifications to users that first appear on top of a context page, then disappear and go into a separate overlay tab with history. Notifications can contain buttons with quick actions. Their lifecycle is independent of the dapplet lifecycle. It is also possible to display modal windows that will not disappear until the user interacts with them (alternative to alert and confirm).

### Connected Accounts

The platform has a built-in service for linking Web2 and Web3 accounts. Currently, the following providers are implemented: Ethereum, NEAR Protocol, Twitter, and GitHub. The links are stored in a smart contract on the NEAR Protocol blockchain. This allows the building of decentralized applications with on-chain verification of accounts.

### There is more

- Quick app creation with npm utility npx create-dapplet-app
- Deploy modules directly from an extension
- Deploy modules from CI/CD (in development)
- There is no need for developer to go to the Google Extension Store yourself - the platform is already there
- Free, open source, support from the development team

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
