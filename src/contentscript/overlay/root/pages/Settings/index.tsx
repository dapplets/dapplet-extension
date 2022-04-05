import React, {
  FC,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useState,
  ChangeEventHandler,
  useEffect,
} from 'react'
import cn from 'classnames'
import styles from './Settings.module.scss'
import { SettingTitle } from '../../components/SettingTitle'
import { SettingItem } from '../../components/SettingItem'
import { Switch } from '../../components/Switch'
import { Dropdown } from '../../components/Dropdown'
import { SettingWrapper } from '../../components/SettingWrapper'
import { Checkbox } from '../../components/Checkbox'
import { InputPanel } from '../../components/InputPanel'
// import { CheckboxList } from '../Notifications'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useToggle } from '../../hooks/useToggle'
import { trimUriPrefix } from 'skynet-js/dist/cjs/utils/string'

enum SettingsTabs {
  MAIN = 0,
  ADVANCED = 1,
  DEVELOPER = 2,
}

// interface ISettingsState {
//   isLoading: boolean;
//   connected: boolean;

//   profiles: string[];
//   currentProfile: string;

//   registries: { url: string, isDev: boolean, isAvailable: boolean, error: string, isEnabled: boolean }[];
//   registryInput: string;
//   registryInputError: string;

//   trustedUsers: { account: string }[];
//   trustedUserInput: string;
//   trustedUserInputError: string;

//   providerInput: string;
//   providerInputError: string;
//   providerLoading: boolean;
//   providerEdited: boolean;

//   swarmGatewayInput: string;
//   swarmGatewayInputError: string;
//   swarmGatewayLoading: boolean;
//   swarmGatewayEdited: boolean;

//   swarmPostageStampIdInput: string;
//   swarmPostageStampIdInputError: string;
//   swarmPostageStampIdLoading: boolean;
//   swarmPostageStampIdEdited: boolean;

//   ipfsGatewayInput: string;
//   ipfsGatewayInputError: string;
//   ipfsGatewayLoading: boolean;
//   ipfsGatewayEdited: boolean;

//   siaPortalInput: string;
//   siaPortalInputError: string;
//   siaPortalLoading: boolean;
//   siaPortalEdited: boolean;

//   identityInput: string;
//   identityInputError: string;
//   identityLoading: boolean;
//   identityEdited: boolean;

//   devMode: boolean;
//   autoBackup: boolean;
//   isUpdateAvailable: boolean;
//   popupInOverlay: boolean;

//   errorReporting: boolean;
//   userAgentId: string;
//   userAgentNameInput: string;
//   userAgentNameInputError: string;
//   userAgentNameLoading: boolean;
//   userAgentNameEdited: boolean;

//   dynamicAdapterInput: string;
//   dynamicAdapterInputError: string;
//   dynamicAdapterLoading: boolean;
//   dynamicAdapterEdited: boolean;

//   preferedOverlayStorage: string;
// }

export const NAVIGATION_LIST = [
  { _id: '0', title: 'Main' },
  { _id: '1', title: 'Advanced' },
  { _id: '2', title: 'Developer' },
]

export const DROPDOWN_LIST = [
  { _id: '0', label: 'Vertion name' },
  { _id: '1', label: 'Vertion name' },
  { _id: '2', label: 'Vertion name' },
]
export const CHECKBOX_LIST = [
  {
    id: 0,
    title: 'System',
    isCheckbox: true,
  },
  {
    id: 2,
    title: 'Label',
    isCheckbox: false,
  },
  {
    id: 3,
    title: 'Label',
    isCheckbox: false,
  },
  {
    id: 4,
    title: 'Label',
    isCheckbox: false,
  },
  {
    id: 5,
    title: 'Label',
    isCheckbox: false,
  },
  {
    id: 6,
    title: 'Label',
    isCheckbox: false,
  },
]

export const checkboxList = (): React.ReactElement => (
  <>
    <Checkbox title="System" isCheckbox={true} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
  </>
)
let _isMounted = false
export const SettingsOverlay = () => {
  const [isAutoupdateActive, onAutoupdateActive] = useToggle(false)
  const [isNotificationActive, onNotificationActive] = useToggle(false)
  const [isUpdateAvailable, onUpdateAvailable] = useState(false)
  const [activeTab, setActiveTab] = useState(SettingsTabs.ADVANCED)
  const [providerInput, setProviderInput] = useState('')
  const [providerEdited, setProviderEdited] = useState(false)
  useEffect(() => {
    _isMounted = true
    const loadProvider = async () => {
      const { getEthereumProvider } = await initBGFunctions(browser)
      const provider = await getEthereumProvider()
      setProviderInput(provider)
    }
    const setProvider = async (provider: string) => {
      try {
        // this.setState({ providerLoading: true });
        const { setEthereumProvider } = await initBGFunctions(browser)
        await setEthereumProvider(provider)
        // this.loadProvider();
        // this.setState({ providerLoading: false, providerEdited: false });
        setProviderEdited(false)
      } catch (err) {
        setProviderEdited(false)
        // this.setState({
        //     // providerLoading: false,

        //     providerInputError: err.message
        // });
      }
    }
    loadProvider()
    // setProvider()?
    return () => {
      _isMounted = false
    }
  }, [])
  // useEffect(() => {
  //   _isMounted = true
  //   // const init = async () => {

  //   //   console.log(isUpdateAvailable)
  //   // }
  //   // init()
  //   checkUpdates()
  //   return () => {
  //     _isMounted = false
  //   }
  // }, [])

  // const checkUpdates = async () => {
  //   const { getNewExtensionVersion } = await initBGFunctions(browser)
  //   const isUpdateAvailable = !!(await getNewExtensionVersion())
  //   onUpdateAvailable(isUpdateAvailable)
  // }

  //   async setProvider(provider: string) {
  //     try {
  //         this.setState({ providerLoading: true });
  //         const { setEthereumProvider } = await initBGFunctions(browser);
  //         await setEthereumProvider(provider);
  //         this.loadProvider();
  //         this.setState({ providerLoading: false, providerEdited: false });
  //     } catch (err) {
  //         this.setState({
  //             providerLoading: false,
  //             providerEdited: false,
  //             providerInputError: err.message
  //         });
  //     }
  // }

  // async _openEtherscan(address: string) {
  //   if (typeOfUri(address) === UriTypes.Ens) {
  //       const { resolveName } = await initBGFunctions(browser);
  //       const ethAddress = await resolveName(address);
  //       window.open(`https://goerli.etherscan.io/address/${ethAddress}`, '_blank');
  //   } else if (typeOfUri(address) === UriTypes.Ethereum) {
  //       window.open(`https://goerli.etherscan.io/address/${address}`, '_blank');
  //   } else if (typeOfUri(address) === UriTypes.Near) {
  //       window.open(`https://explorer.testnet.near.org/accounts/${address}`, '_blank');
  //   }
  // }

  // async loadProvider() {
  //   const { getEthereumProvider } = await initBGFunctions(browser);
  //   const provider = await getEthereumProvider();
  //   this.setState({ providerInput: provider });
  // }

  // async loadAll() {
  //   this.setState({ isLoading: true });
  //   await Promise.all([
  //       this.loadProfiles(),
  //       this.loadRegistries(),
  //       this.loadDevMode(),
  //       this.loadTrustedUsers(),
  //       this.loadAutoBackup(),
  //       this.loadErrorReporting(),
  //       this.loadPopupInOverlay(),
  //       this.checkUpdates(),
  //       this.loadProvider(),
  //       this.loadSwarmGateway(),
  //       this.loadSwarmPostageStampId(),
  //       this.loadIpfsGateway(),
  //       this.loadSiaPortal(),
  //       this.loadIdentityContract(),
  //       this.loadUserAgentId(),
  //       this.loadUserAgentName(),
  //       this.loadDynamicAdapter(),
  //       this.loadPreferedOverlayStorage()
  //   ]);
  //   this.setState({ isLoading: false });
  // }

  // async componentDidMount() {
  //   await this.loadAll();
  // }

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>
        <SettingTitle
          title="Main"
          onClick={() => setActiveTab(SettingsTabs.MAIN)}
          isActive={activeTab === SettingsTabs.MAIN}
        />
        <SettingTitle
          title="Advanced"
          onClick={() => setActiveTab(SettingsTabs.ADVANCED)}
          isActive={activeTab === SettingsTabs.ADVANCED}
        />
        <SettingTitle
          title="Developer"
          onClick={() => setActiveTab(SettingsTabs.DEVELOPER)}
          isActive={activeTab === SettingsTabs.DEVELOPER}
        />
      </div>

      <div className={styles.settingMain}>
        {activeTab === SettingsTabs.MAIN && (
          <>
            <SettingWrapper
              title="Extension settings"
              children={
                <>
                  <SettingItem
                    title="Autoupdate"
                    component={<Switch checked={isUpdateAvailable} />}
                  />
                  <SettingItem
                    title="Notifications"
                    component={
                      <Switch
                        checked={isNotificationActive}
                        onClick={onNotificationActive}
                      />
                    }
                    children={
                      isNotificationActive && (
                        <>
                          {CHECKBOX_LIST.map(({ id, title, isCheckbox }) => (
                            <Checkbox
                              title={title}
                              key={id}
                              isCheckbox={isCheckbox}
                              style={{ width: '30%' }}
                            />
                          ))}
                        </>
                      )
                    }
                    isVisibleAdditionalSettings={isNotificationActive}
                    isShowAdditionalSettings={true}
                  />
                </>
              }
            />
            <SettingWrapper
              title="Dapplets settings"
              children={
                <>
                  <SettingItem
                    title="Autoactivate dapplets"
                    component={<Switch checked={false} />}
                  />
                  <SettingItem
                    title="Autoupdate dapplets"
                    component={<Switch checked={false} />}
                  />
                </>
              }
            />
          </>
        )}
        {activeTab === SettingsTabs.ADVANCED && (
          <>
            {' '}
            <SettingWrapper
              title="Profile"
              // children={

              // }
            />
            <SettingWrapper
              title="Version"
              // children={

              // }
            />
            <SettingWrapper
              title="Trusted Users"
              // children={

              // }
            />
            <SettingWrapper
              title="Core settings"
              children={
                <>
                  <SettingItem
                    title="Registry"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                    children={<InputPanel placeholder="Placeholder" />}
                  />
                  <SettingItem
                    title="User Agent Name"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                    children={
                      <InputPanel placeholder="eda881d858ae4a25b2dfbbd0b4629992" />
                    }
                  />
                  <SettingItem
                    title="Dynamic Adapter"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                    children={
                      <InputPanel placeholder="dynamic-adapter.dapplet-base.eth#default@..." />
                    }
                  />
                  <SettingItem
                    title=" Prefered Overlay Storage"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                  />

                  {/* 
            // Prefered Overlay Storage */}
                </>
              }
            />
            <SettingWrapper
              title="Swarm setup"
              children={
                <>
                  <SettingItem
                    title="Swarm Gateway"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                    children={
                      <InputPanel placeholder="http:\\bee.dapplets.org\" />
                    }
                  />
                  <SettingItem
                    title="Swarm Postage Stamp ID"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                    children={
                      <InputPanel placeholder="Swarm Postage Stamp ID" />
                    }
                  />
                </>
              }
            />
            <SettingWrapper
              title="Ethereum setup"
              children={
                <SettingItem
                  title="Ethereum Provider"
                  component={<Dropdown list={DROPDOWN_LIST} />}
                  children={
                    <InputPanel
                      onChange={(e) => {
                        setProviderInput(e.target.value)
                        setProviderEdited(true)
                      }}
                      value={providerInput}
                      placeholder="eda881d858ae4a25b2dfbbd0b4629992"
                    />
                  }
                />
              }
            />
          </>
        )}
      </div>
    </div>
  )
}
