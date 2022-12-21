import { browser } from 'webextension-polyfill-ts'
import { StorageTypes } from '../../common/constants'
import * as EventBus from '../../common/global-event-bus'
import {
  generateGuid,
  incrementFilename,
  joinUrls,
  pick,
  typeOfUri,
  UriTypes,
} from '../../common/helpers'
import GlobalConfigBrowserStorage from '../browserStorages/globalConfigBrowserStorage'
import { GlobalConfig } from '../models/globalConfig'
import SiteConfig from '../models/siteConfig'
import { SwarmModuleStorage } from '../moduleStorages/swarmModuleStorage'
import EnsService from './ensService'

const EXPORTABLE_PROPERTIES = [
  'id',
  // 'isActive',
  // 'suspended',
  // 'walletInfo',
  'registries',
  // 'intro',
  'devMode',
  'trustedUsers',
  // 'userSettings',
  'errorReporting',
  // 'userAgentId',
  'userAgentName',
  // 'autoBackup',
  'providerUrl',
  'xdaiProviderUrl',
  'swarmGatewayUrl',
  'ipfsGatewayUrl',
  'siaPortalUrl',
  // 'walletsUsage',
  'identityContract',
  'popupInOverlay',
  'hostnames',
  //'lastDevMessageHash',
  //'ignoredUpdate',
  'dynamicAdapter',
  'preferedOverlayStorage',
  'myDapplets',
  'connectedAccountContractAddress',
]

export default class GlobalConfigService {
  private _globalConfigRepository = new GlobalConfigBrowserStorage()
  private _defaultConfigId = 'default'

  public ensService: EnsService

  async get(): Promise<GlobalConfig> {
    const configs = await this._globalConfigRepository.getAll()
    const config =
      configs.find((x) => x.isActive) ?? configs.find((x) => x.id === this._defaultConfigId)

    if (config) {
      if (!config.swarmGatewayUrl) config.swarmGatewayUrl = this.getInitialConfig().swarmGatewayUrl
      if (!config.swarmPostageStampId)
        config.swarmPostageStampId = this.getInitialConfig().swarmPostageStampId
      if (!config.preferedOverlayStorage)
        config.preferedOverlayStorage = this.getInitialConfig().preferedOverlayStorage
      if (!config.ipfsGatewayUrl) config.ipfsGatewayUrl = this.getInitialConfig().ipfsGatewayUrl
      if (!config.siaPortalUrl) config.siaPortalUrl = this.getInitialConfig().siaPortalUrl
      if (!config.nearNetworks) config.nearNetworks = this.getInitialConfig().nearNetworks
      if (!config.ethereumNetworks)
        config.ethereumNetworks = this.getInitialConfig().ethereumNetworks
      if (!config.myDapplets) config.myDapplets = this.getInitialConfig().myDapplets
      if (!config.targetStorages) config.targetStorages = this.getInitialConfig().targetStorages
      if (!config.xdaiProviderUrl) config.xdaiProviderUrl = this.getInitialConfig().xdaiProviderUrl
      if (!config.connectedAccountsContractAddress)
        config.connectedAccountsContractAddress =
          this.getInitialConfig().connectedAccountsContractAddress
      if (!config.pinnedDappletActions)
        config.pinnedDappletActions = this.getInitialConfig().pinnedDappletActions
    }

    return config ?? this.getInitialConfig()
  }

  async set(config: GlobalConfig): Promise<void> {
    await this._globalConfigRepository.update(config)
  }

  async mergeConfig(config: Partial<GlobalConfig>): Promise<void> {
    const previousConfig = await this.get()
    const newConfig = { ...previousConfig, ...config }
    await this.set(newConfig)
  }

  async getProfiles(): Promise<{ id: string; isActive: boolean }[]> {
    const configs = await this._globalConfigRepository.getAll()
    if (configs.length === 0) configs.push(this.getInitialConfig())
    if (!configs.find((x) => x.isActive))
      configs.find((x) => x.id === this._defaultConfigId).isActive = true
    return configs.map((x) => ({ id: x.id, isActive: x.isActive }))
  }

  async setActiveProfile(profileId: string) {
    const configs = await this._globalConfigRepository.getAll()

    for (const config of configs) {
      // activate new config
      if (config.id === profileId) {
        config.isActive = true
        await this._globalConfigRepository.update(config)
      }

      // deactivate old configs
      if (config.id !== profileId && config.isActive === true) {
        config.isActive = false
        await this._globalConfigRepository.update(config)
      }
    }
  }

  async renameProfile(profileId: string, newProfileId: string) {
    let oldConfig = await this._globalConfigRepository.getById(profileId)
    if (!oldConfig && profileId === this._defaultConfigId) oldConfig = this.getInitialConfig()
    if (!oldConfig) throw new Error(`The "${profileId}" profile doesn't exist.`)

    oldConfig.id = newProfileId
    await this._globalConfigRepository.deleteById(profileId)
    await this._globalConfigRepository.create(oldConfig)
  }

  async copyProfile(sourceProfileId: string, makeActive = false) {
    let config = await this._globalConfigRepository.getById(sourceProfileId)
    if (!config && sourceProfileId === this._defaultConfigId) config = this.getInitialConfig()
    if (!config) throw new Error(`Profile "${sourceProfileId}" doesn't exist.`)

    // Add increment for uniqueness of profile id
    while (await this._globalConfigRepository.getById(config.id)) {
      config.id = incrementFilename(config.id)
    }

    config.isActive = false

    await this._globalConfigRepository.create(config)

    if (makeActive) {
      await this.setActiveProfile(config.id)
    }

    return config.id
  }

  async deleteProfile(id: string) {
    const config = await this._globalConfigRepository.getById(id)
    if (!config) return
    if (config.isActive) throw new Error(`Cannot delete active profile.`)

    await this._globalConfigRepository.deleteById(id)
  }

  async importProfile(url: string, makeActive = false): Promise<string> {
    const swarmGatewayUrl = await this.getSwarmGateway()
    const swarmPostageStampId = await this.getSwarmPostageStampId()
    const swarmStorage = new SwarmModuleStorage({
      swarmGatewayUrl,
      swarmPostageStampId,
    })
    const arr = await swarmStorage.getResource(url)
    const json = new TextDecoder('utf-8').decode(new Uint8Array(arr))
    const config = JSON.parse(json)
    const importingConfig = pick(config, ...EXPORTABLE_PROPERTIES)
    const mergedConfigs = Object.assign(this.getInitialConfig(), importingConfig)

    // Add increment for uniqueness of profile id
    while (await this._globalConfigRepository.getById(mergedConfigs.id)) {
      mergedConfigs.id = incrementFilename(mergedConfigs.id)
    }

    // ToDo: reset unwanted settings
    mergedConfigs.isActive = false

    await this._globalConfigRepository.create(mergedConfigs)

    if (makeActive) {
      await this.setActiveProfile(mergedConfigs.id)
    }

    return mergedConfigs.id
  }

  async exportProfile(profileId: string): Promise<string> {
    let config = await this._globalConfigRepository.getById(profileId)

    if (!config && profileId === this._defaultConfigId) config = this.getInitialConfig()
    if (!config) throw new Error(`Profile "${profileId}" doesn't exist.`)

    const exportedConfig = pick(config, ...EXPORTABLE_PROPERTIES)
    const json = JSON.stringify(exportedConfig)
    const blob = new Blob([json], { type: 'application/json' })
    const swarmGatewayUrl = await this.getSwarmGateway()
    const swarmPostageStampId = await this.getSwarmPostageStampId()
    const swarmStorage = new SwarmModuleStorage({
      swarmGatewayUrl,
      swarmPostageStampId,
    })
    const url = await swarmStorage.save(blob)
    return url
  }

  async createShareLink(profileId?: string): Promise<string> {
    if (!profileId) {
      const profiles = await this.getProfiles()
      profileId = profiles.find((x) => x.isActive).id
    }

    const bzzLink = await this.exportProfile(profileId)
    const swarmGatewayUrl = await this.getSwarmGateway()
    const absoluteLink = joinUrls(swarmGatewayUrl, 'bzz/' + bzzLink.replace('bzz://', ''))
    const shareLink = `https://github.com/dapplets/dapplet-extension/releases/download/v${EXTENSION_VERSION}/dapplet-extension.zip?config=${absoluteLink}`
    return shareLink
  }

  getInitialConfig(): GlobalConfig {
    const config = new GlobalConfig()
    config.id = this._defaultConfigId
    config.isActive = true
    config.registries = [
      { url: 'v2.registry.dapplet-base.eth', isDev: false, isEnabled: true },
      {
        url: 'dev-1627024020035-70641704943070',
        isDev: false,
        isEnabled: false,
      },
      {
        url: 'https://localhost:8080/index.json',
        isDev: true,
        isEnabled: false,
      },
      {
        url: 'https://localhost:3001/dapplet.json',
        isDev: true,
        isEnabled: false,
      },
      {
        url: 'https://localhost:3002/dapplet.json',
        isDev: true,
        isEnabled: false,
      },
      {
        url: 'https://localhost:3003/dapplet.json',
        isDev: true,
        isEnabled: false,
      },
    ]
    config.devMode = true
    config.trustedUsers = [
      { account: 'listing.dapplet-base.eth' },
      { account: 'buidl.testnet' },
      { account: 'nik3ter.testnet' },
      { account: 'dapplets.testnet' },
    ]
    config.targetStorages = [StorageTypes.Ipfs, StorageTypes.Swarm]
    config.userSettings = {}
    config.providerUrl = 'https://goerli.mooo.com/'
    config.xdaiProviderUrl = 'https://rpc.gnosischain.com/'
    config.swarmGatewayUrl = 'https://swarmgateway.mooo.com/'
    config.walletsUsage = {}
    config.identityContract = '0xf6b3a0B20281796D465bB8613e233BE30be07084'
    config.popupInOverlay = true
    config.autoBackup = true
    config.errorReporting = true
    config.userAgentId = generateGuid()
    config.userAgentName = ''
    config.hostnames = {}
    config.dynamicAdapter = 'dynamic-adapter.dapplet-base.eth#default@latest'
    config.preferedOverlayStorage = 'centralized'
    config.swarmPostageStampId = '1149efd4cce752c75e815e9b9dbe322afd0c8dce7f86d78e26182b9923403965'
    config.ipfsGatewayUrl = 'https://ipfs-gateway.mooo.com'
    config.siaPortalUrl = 'https://siasky.net'
    config.ethereumNetworks = [
      {
        networkId: 'rinkeby',
        chainId: 4,
        nodeUrl: 'https://rinkeby.infura.io/v3/eda881d858ae4a25b2dfbbd0b4629992',
        explorerUrl: 'https://rinkeby.etherscan.io',
      },
      {
        networkId: 'goerli',
        chainId: 5,
        nodeUrl: 'https://goerli.mooo.com/',
        explorerUrl: 'https://goerli.etherscan.io',
      },
    ]
    config.nearNetworks = [
      {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org/',
        walletUrl: 'https://wallet.testnet.near.org/',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org/',
      },
      {
        networkId: 'mainnet',
        nodeUrl: 'https://rpc.mainnet.near.org',
        walletUrl: 'https://wallet.mainnet.near.org',
        helperUrl: 'https://helper.mainnet.near.org',
        explorerUrl: 'https://explorer.mainnet.near.org',
      },
      {
        networkId: 'betanet',
        nodeUrl: 'https://rpc.betanet.near.org',
        walletUrl: 'https://wallet.betanet.near.org',
        helperUrl: 'https://helper.betanet.near.org',
        explorerUrl: 'https://explorer.betanet.near.org',
      },
      {
        networkId: 'local',
        nodeUrl: 'http://localhost:3030',
        walletUrl: 'http://localhost:4000/wallet',
      },
    ]
    config.myDapplets = []
    config.connectedAccountsContractAddress = 'dev-1659683929908-36510272337320'
    config.pinnedDappletActions = []
    return config
  }
  async getPinnedActions() {
    const config = await this.get()
    const registries = config.pinnedDappletActions.map((x) => ({
      ...x,
      dappletName: x.dappletName === undefined ? true : x.dappletName,
      widgetPinId: x.widgetPinId === undefined ? true : x.widgetPinId,
    }))
    return registries
  }
  async removePinnedActions(dappletName: string, widgetPinId: string) {
    await this.updateConfig(
      (c) =>
        (c.pinnedDappletActions = c.pinnedDappletActions.filter(
          (x) => !(x.dappletName === dappletName && x.widgetPinId === widgetPinId)
        ))
    )
    EventBus.emit('myactions_changed')
  }

  async addPinnedActions(dappletName: string, widgetPinId: string) {
    const config = await this.get()

    if (
      config.pinnedDappletActions.find(
        (x) => x.dappletName === dappletName && x.widgetPinId === widgetPinId
      )
    )
      return
    config.pinnedDappletActions.push({ dappletName, widgetPinId })

    await this.set(config)
    EventBus.emit('myactions_changed')
  }

  async getRegistries() {
    const config = await this.get()
    const registries = config.registries.map((x) => ({
      ...x,
      isEnabled: x.isEnabled === undefined ? true : x.isEnabled,
    }))
    return registries
  }

  async addRegistry(url: string, isDev: boolean) {
    const isEthAddress = typeOfUri(url) === UriTypes.Ethereum
    const isEnsAddress = typeOfUri(url) === UriTypes.Ens
    const isHttpAddress = typeOfUri(url) === UriTypes.Http
    const isNearAddress = typeOfUri(url) === UriTypes.Near

    if (isHttpAddress) isDev = true

    if (!isEthAddress && !isEnsAddress && !isHttpAddress && !isNearAddress)
      throw new Error('Unsupported URL type')
    if (isDev && !isHttpAddress)
      throw new Error('Only HTTP(S) links are supported for development servers')
    if (!isDev && !isEthAddress && !isEnsAddress && !isNearAddress)
      throw new Error('A public registry must have a valid Ethereum, ENS or NEAR Protocol address')

    const config = await this.get()
    if (config.registries.find((r) => r.url === url)) return

    // Dev registries are enabled by default
    const isEnabled = isDev ? true : false

    if (isEthAddress || isEnsAddress || isNearAddress) {
      // ToDo: fix it
      // if (isEnsAddress) {
      //     const signer = new WalletConnectSigner();
      //     const address = await signer.resolveName(url);
      //     if (!address) throw new Error("Can not resolve the ENS name");
      // }

      config.registries.push({ url, isDev, isEnabled: isEnabled })
      await this.set(config)
    } else {
      // ToDo: check prod registry correctly
      if (!isDev) {
        config.registries.push({ url, isDev, isEnabled: isEnabled })
        await this.set(config)
        return
      }

      const checkAndAdd = async (url) => {
        try {
          const resp = await fetch(url)
          if (!resp.ok) return false
          const obj = await resp.json()
          if (!(Array.isArray(obj) || (obj.name && obj.version && obj.type))) return false
          if (config.registries.find((r) => r.url === url)) return true
          config.registries.push({ url, isDev, isEnabled: isEnabled })
          await this.set(config)
          return true
        } catch (_) {
          return false
        }
      }

      // try find manifest by another paths
      const success =
        (await checkAndAdd(url)) ||
        (await checkAndAdd(joinUrls(url, 'dapplet.json'))) ||
        (await checkAndAdd(joinUrls(url, 'index.json')))

      if (!success) throw Error('The registry is not available.')
    }
  }

  async removeRegistry(url: string) {
    return this.updateConfig((c) => (c.registries = c.registries.filter((r) => r.url !== url)))
  }

  async enableRegistry(url: string) {
    const config = await this.get()
    const registry = config.registries.find((x) => x.url === url)
    registry.isEnabled = true

    // only one production registry can be enabled
    if (!registry.isDev) {
      config.registries
        .filter((x) => x.url !== url && !x.isDev)
        .forEach((x) => (x.isEnabled = false))
    }

    return this.set(config)
  }

  async disableRegistry(url: string) {
    return this.updateConfig((c) => (c.registries.find((x) => x.url === url).isEnabled = false))
  }

  async getIntro() {
    const config = await this.get()
    return config.intro
  }

  async setIntro(intro: any) {
    return this.updateConfig((c) =>
      Object.entries(intro).forEach(([key, value]) => (c.intro[key] = value))
    )
  }

  async getDevMode() {
    const config = await this.get()
    return config.devMode
  }

  async setDevMode(isActive: boolean) {
    return this.updateConfig((c) => (c.devMode = isActive))
  }

  async updateConfig(callback: (config: GlobalConfig) => void) {
    const config = await this.get()
    callback(config)
    await this.set(config)
  }

  async updateTargetStorages(storages: StorageTypes[]) {
    console.log('storages', storages)
    const config = await this.get()
    config.targetStorages = storages
    await this.set(config)
  }

  async getTargetStorages() {
    const config = await this.get()
    return config.targetStorages
  }

  async getTrustedUsers() {
    const config = await this.get()
    return config.trustedUsers
  }

  async addTrustedUser(account: string) {
    const config = await this.get()
    if (config.trustedUsers.find((r) => r.account === account)) return

    const isEthAddress = typeOfUri(account) === UriTypes.Ethereum
    const isEnsAddress = typeOfUri(account) === UriTypes.Ens
    const isNearAddress = typeOfUri(account) === UriTypes.Near

    if (!isEthAddress && !isEnsAddress && !isNearAddress)
      throw Error('User account must be valid Ethereum or NEAR Protocol address')

    // ToDo: fix it
    // if (isEnsAddress) {
    //     const provider = await this.getEthereumProvider();
    //     const signer = new WalletConnectSigner(provider);
    //     const address = await signer.resolveName(account);
    //     if (!address) throw new Error("Can not resolve the ENS name");
    // }

    config.trustedUsers.push({ account: account })
    await this.set(config)

    EventBus.emit('trustedusers_changed')
  }

  async containsTrustedUser(account: string): Promise<boolean> {
    const trustedUsers = await this.getTrustedUsers()

    // compare addresses as strings
    if (trustedUsers.find((x) => x.account.toLowerCase() === account.toLowerCase())) {
      return true
    }

    // check ENS names
    for (const trustedUser of trustedUsers) {
      if (typeOfUri(trustedUser.account) === UriTypes.Ens) {
        const trustedUserAddress = await this.ensService.resolveName(trustedUser.account)
        if (!trustedUserAddress) continue
        if (trustedUserAddress.toLowerCase() === account.toLowerCase()) {
          return true
        }
      }
    }

    return false
  }

  async removeTrustedUser(account: string) {
    await this.updateConfig(
      (c) => (c.trustedUsers = c.trustedUsers.filter((r) => r.account !== account))
    )
    EventBus.emit('trustedusers_changed')
  }

  async getUserSettings(moduleName: string, key: string) {
    const config = await this.get()
    if (!config.userSettings[moduleName]) return undefined
    return config.userSettings[moduleName][key]
  }

  async setUserSettings(moduleName: string, key: string, value: any) {
    const config = await this.get()
    if (!config.userSettings[moduleName]) config.userSettings[moduleName] = {}
    config.userSettings[moduleName][key] = value
    await this.set(config)
  }

  async getAllUserSettings(moduleName: string) {
    const config = await this.get()
    return config.userSettings[moduleName] || {}
  }

  async setAllUserSettings(moduleName: string, values: any) {
    const config = await this.get()
    config.userSettings[moduleName] = values
    await this.set(config)
  }

  async removeUserSettings(moduleName: string, key: string) {
    const config = await this.get()
    if (!config.userSettings[moduleName]) return
    delete config.userSettings[moduleName][key]
    await this.set(config)
  }

  async clearUserSettings(moduleName: string) {
    const config = await this.get()
    if (!config.userSettings[moduleName]) return
    delete config.userSettings[moduleName]
    await this.set(config)
  }

  async getErrorReporting() {
    const config = await this.get()
    return config.errorReporting
  }

  async setErrorReporting(isActive: boolean) {
    return this.updateConfig((c) => (c.errorReporting = isActive))
  }

  async getPopupInOverlay() {
    const config = await this.get()
    return config.popupInOverlay
  }

  async setPopupInOverlay(isActive: boolean) {
    await this.updateConfig((c) => (c.popupInOverlay = isActive))
    await browser.browserAction.setPopup({
      popup: isActive ? '' : 'popup.html',
    })
  }

  async getAutoBackup() {
    const config = await this.get()
    return config.autoBackup
  }

  async setAutoBackup(isActive: boolean) {
    return this.updateConfig((c) => (c.autoBackup = isActive))
  }

  async setEthereumProvider(url: string) {
    if (typeOfUri(url) !== UriTypes.Http) throw new Error('URL must be a valid HTTP(S) address.')
    await this._checkEthereumProvider(url)
    await this.updateConfig((c) => (c.providerUrl = url))
  }

  async getEthereumProvider() {
    return this.get().then((x) => x.providerUrl)
  }

  async setXdaiProvider(url: string) {
    if (typeOfUri(url) !== UriTypes.Http) throw new Error('URL must be a valid HTTP(S) address.')
    await this._checkEthereumProvider(url)
    await this.updateConfig((c) => (c.xdaiProviderUrl = url))
  }

  async getXdaiProvider() {
    return this.get().then((x) => x.xdaiProviderUrl)
  }

  async setSwarmGateway(url: string) {
    if (typeOfUri(url) !== UriTypes.Http) throw new Error('URL must be a valid HTTP(S) address.')

    try {
      const response = await fetch(url)
      const text = await response.text()
      if (!text.includes('Ethereum Swarm Bee')) throw new Error()
    } catch (err) {
      throw new Error(
        'The server returns invalid response. Make sure the server complies with the Swarm API Specification.'
      )
    }

    await this.updateConfig((c) => (c.swarmGatewayUrl = url))
  }

  async getSwarmGateway() {
    return this.get().then((x) => x.swarmGatewayUrl)
  }

  async getWalletsUsage() {
    const config = await this.get()
    return config.walletsUsage ?? {}
  }

  async setWalletsUsage(walletsUsage: { [moduleName: string]: { [chain: string]: string } }) {
    return this.updateConfig((c) => (c.walletsUsage = walletsUsage))
  }

  async getIdentityContract() {
    return this.get().then((x) => x.identityContract)
  }

  async setIdentityContract(address: string) {
    return this.updateConfig((c) => (c.identityContract = address))
  }

  async getUserAgentId() {
    return this.get().then((x) => x.userAgentId)
  }

  async getUserAgentName() {
    return this.get().then((x) => x.userAgentName)
  }

  async setUserAgentName(value: string) {
    return this.updateConfig((c) => (c.userAgentName = value))
  }

  async getSiteConfigById(id: string) {
    const globalConfig = await this.get()
    let config = globalConfig.hostnames?.[id]

    if (!config) {
      config = new SiteConfig()
      config.hostname = id
      config.activeFeatures = {}
      config.paused = false
    }

    return config
  }

  async updateSiteConfig(config: SiteConfig) {
    const globalConfig = await this.get()
    if (!config.hostname) throw new Error('"hostname" is required in SiteConfig.')
    if (!globalConfig.hostnames) globalConfig.hostnames = {}
    globalConfig.hostnames[config.hostname] = config
    await this.set(globalConfig)
  }

  async getLastDevMessageHash() {
    return this.get().then((x) => x.lastDevMessageHash)
  }

  async setLastDevMessageHash(hash: string) {
    return this.updateConfig((c) => (c.lastDevMessageHash = hash))
  }

  async getIgnoredUpdate() {
    return this.get().then((x) => x.ignoredUpdate)
  }

  async setIgnoredUpdate(version: string) {
    return this.updateConfig((c) => (c.ignoredUpdate = version))
  }

  async getLastMessageSeenTimestamp() {
    return this.get().then((x) => x.lastMessageSeenTimestamp)
  }

  async setLastMessageSeenTimestamp(lastMessageSeenTimestamp: string) {
    return this.updateConfig((c) => (c.lastMessageSeenTimestamp = lastMessageSeenTimestamp))
  }

  async getDynamicAdapter() {
    return this.get().then((x) => x.dynamicAdapter)
  }

  async setDynamicAdapter(dynamicAdapter: string) {
    return this.updateConfig((c) => (c.dynamicAdapter = dynamicAdapter))
  }

  async getPreferedOverlayStorage() {
    return this.get().then((x) => x.preferedOverlayStorage)
  }

  async setPreferedOverlayStorage(storage: string) {
    return this.updateConfig((c) => (c.preferedOverlayStorage = storage))
  }

  async getSwarmPostageStampId() {
    return this.get().then((x) => x.swarmPostageStampId)
  }

  async setSwarmPostageStampId(postageStampId: string) {
    return this.updateConfig((c) => (c.swarmPostageStampId = postageStampId))
  }

  async getIpfsGateway() {
    return this.get().then((x) => x.ipfsGatewayUrl)
  }

  async setIpfsGateway(url: string) {
    if (typeOfUri(url) !== UriTypes.Http) throw new Error('URL must be a valid HTTP(S) address.')
    await this.updateConfig((c) => (c.ipfsGatewayUrl = url))
  }

  async getSiaPortal() {
    return this.get().then((x) => x.siaPortalUrl)
  }

  async setSiaPortal(url: string) {
    if (typeOfUri(url) !== UriTypes.Http) throw new Error('URL must be a valid HTTP(S) address.')
    await this.updateConfig((c) => (c.siaPortalUrl = url))
  }

  async getNearNetworks() {
    const config = await this.get()
    return config.nearNetworks
  }

  async getEthereumNetworks() {
    const config = await this.get()
    return config.ethereumNetworks
  }

  async getMyDapplets() {
    const config = await this.get()
    return config.myDapplets
  }

  async addMyDapplet(registryUrl: string, name: string) {
    const config = await this.get()
    if (config.myDapplets.find((x) => x.registryUrl === registryUrl && x.name === name)) return
    config.myDapplets.push({ registryUrl, name })
    await this.set(config)
    EventBus.emit('mydapplets_changed')
  }

  async removeMyDapplet(registryUrl: string, name: string) {
    await this.updateConfig(
      (c) =>
        (c.myDapplets = c.myDapplets.filter(
          (x) => !(x.registryUrl === registryUrl && x.name === name)
        ))
    )
    EventBus.emit('mydapplets_changed')
  }

  private async _checkEthereumProvider(url: string) {
    try {
      const body = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 0,
      })
      const headers = { 'Content-Type': 'application/json' }
      const response = await fetch(url, { method: 'POST', body, headers })
      const json = await response.json()
      if (!json.result) throw new Error()
    } catch (err) {
      throw new Error(
        'The server returns invalid response. Make sure the server complies with the Ethereum JSON RPC Specification.'
      )
    }
  }

  async getConnectedAccountsContractAddress() {
    const config = await this.get()
    return config.connectedAccountsContractAddress
  }
}
