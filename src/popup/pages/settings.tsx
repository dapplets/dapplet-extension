import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Popup, Segment, List, Label, Input, Checkbox, Icon, Header, Button, Dropdown, Form, Divider, Menu } from "semantic-ui-react";
import { isValidHttp, isValidUrl } from '../helpers';
import { parseModuleName, typeOfUri, UriTypes } from '../../common/helpers';
import { ProfileDropdown } from "../components/ProfileDropdown";

interface ISettingsProps {
    devMode: boolean;
    updateTabs: () => Promise<void>;
    isOverlay: boolean;
}

interface ISettingsState {
    isLoading: boolean;
    connected: boolean;

    profiles: string[];
    currentProfile: string;

    registries: { url: string, isDev: boolean, isAvailable: boolean, error: string, isEnabled: boolean }[];
    registryInput: string;
    registryInputError: string;

    trustedUsers: { account: string }[];
    trustedUserInput: string;
    trustedUserInputError: string;

    userSettingsInput: string;
    userSettingsInputError: string;
    userSettingsLoading: boolean;

    providerInput: string;
    providerInputError: string;
    providerLoading: boolean;
    providerEdited: boolean;

    swarmGatewayInput: string;
    swarmGatewayInputError: string;
    swarmGatewayLoading: boolean;
    swarmGatewayEdited: boolean;

    identityInput: string;
    identityInputError: string;
    identityLoading: boolean;
    identityEdited: boolean;

    devMode: boolean;
    autoBackup: boolean;
    isUpdateAvailable: boolean;
    popupInOverlay: boolean;
    
    errorReporting: boolean;
    userAgentId: string;
    userAgentNameInput: string;
    userAgentNameInputError: string;
    userAgentNameLoading: boolean;
    userAgentNameEdited: boolean;

    dynamicAdapterInput: string;
    dynamicAdapterInputError: string;
    dynamicAdapterLoading: boolean;
    dynamicAdapterEdited: boolean;

    preferedOverlayStorage: string;
}

class Settings extends React.Component<ISettingsProps, ISettingsState> {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            connected: false,
            profiles: [],
            currentProfile: '',
            registries: [],
            registryInput: '',
            registryInputError: null,
            trustedUsers: [],
            trustedUserInput: '',
            trustedUserInputError: null,
            devMode: props.devMode,
            userSettingsInput: '',
            userSettingsInputError: null,
            userSettingsLoading: false,
            autoBackup: false,
            isUpdateAvailable: false,
            providerInput: '',
            providerInputError: null,
            providerLoading: false,
            providerEdited: false,
            swarmGatewayInput: '',
            swarmGatewayInputError: null,
            swarmGatewayLoading: false,
            swarmGatewayEdited: false,
            identityInput: '',
            identityInputError: null,
            identityLoading: false,
            identityEdited: false,
            popupInOverlay: false,
            errorReporting: true,
            userAgentId: '',
            userAgentNameInput: '',
            userAgentNameInputError: null,
            userAgentNameLoading: false,
            userAgentNameEdited: false,
            dynamicAdapterInput: '',
            dynamicAdapterInputError: null,
            dynamicAdapterLoading: false,
            dynamicAdapterEdited: false,
            preferedOverlayStorage: ''
        };
    }

    async componentDidMount() {
        await this.loadAll();
    }

    async loadAll() {
        this.setState({ isLoading: true });
        await Promise.all([
            this.loadProfiles(),
            this.loadRegistries(),
            this.loadDevMode(),
            this.loadTrustedUsers(),
            this.loadAutoBackup(),
            this.loadErrorReporting(),
            this.loadPopupInOverlay(),
            this.checkUpdates(),
            this.loadProvider(),
            this.loadSwarmGateway(),
            this.loadIdentityContract(),
            this.loadUserAgentId(),
            this.loadUserAgentName(),
            this.loadDynamicAdapter(),
            this.loadPreferedOverlayStorage()
        ]);
        this.setState({ isLoading: false });
    }

    async loadProfiles() {
        const { getProfiles } = await initBGFunctions(browser);
        const profiles = await getProfiles();

        this.setState({
            profiles: profiles.map(x => x.id),
            currentProfile: profiles.find(x => x.isActive).id
        });
    }

    async loadRegistries() {
        const { getRegistries } = await initBGFunctions(browser);
        const registries = await getRegistries();

        this.setState({
            registries: registries.filter(r => r.isDev === false)
        });
    }

    async loadTrustedUsers() {
        const { getTrustedUsers } = await initBGFunctions(browser);
        const trustedUsers = await getTrustedUsers();
        this.setState({ trustedUsers });
    }

    async loadDevMode() {
        const { getDevMode } = await initBGFunctions(browser);
        const devMode = await getDevMode();
        this.setState({ devMode });
    }

    async loadProvider() {
        const { getEthereumProvider } = await initBGFunctions(browser);
        const provider = await getEthereumProvider();
        this.setState({ providerInput: provider });
    }

    async setProvider(provider: string) {
        this.setState({ providerLoading: true });
        const { setEthereumProvider } = await initBGFunctions(browser);
        await setEthereumProvider(provider);
        this.loadProvider();
        this.setState({ providerLoading: false, providerEdited: false });
    }

    async loadSwarmGateway() {
        const { getSwarmGateway } = await initBGFunctions(browser);
        const gateway = await getSwarmGateway();
        this.setState({ swarmGatewayInput: gateway });
    }

    async setSwarmGateway(gateway: string) {
        this.setState({ swarmGatewayLoading: true });
        const { setSwarmGateway } = await initBGFunctions(browser);
        await setSwarmGateway(gateway);
        this.loadSwarmGateway();
        this.setState({ swarmGatewayLoading: false, swarmGatewayEdited: false });
    }

    async setDevMode(isActive: boolean) {
        const { setDevMode } = await initBGFunctions(browser);
        await setDevMode(isActive);
        this.loadDevMode();
        await this.props.updateTabs();
    }

    async loadAutoBackup() {
        const { getAutoBackup } = await initBGFunctions(browser);
        const autoBackup = await getAutoBackup();
        this.setState({ autoBackup });
    }

    async setAutoBackup(isActive: boolean) {
        const { setAutoBackup } = await initBGFunctions(browser);
        await setAutoBackup(isActive);
        this.loadAutoBackup();
    }

    async loadErrorReporting() {
        const { getErrorReporting } = await initBGFunctions(browser);
        const errorReporting = await getErrorReporting();
        this.setState({ errorReporting });
    }

    async loadPopupInOverlay() {
        const { getPopupInOverlay } = await initBGFunctions(browser);
        const popupInOverlay = await getPopupInOverlay();
        this.setState({ popupInOverlay });
    }

    async setPopupInOverlay(isActive: boolean) {
        const { setPopupInOverlay } = await initBGFunctions(browser);
        await setPopupInOverlay(isActive);
        this.loadPopupInOverlay();
    }

    async loadUserAgentId() {
        const { getUserAgentId } = await initBGFunctions(browser);
        const userAgentId = await getUserAgentId();

        this.setState({ userAgentId });
    }

    async loadUserAgentName() {
        const { getUserAgentName } = await initBGFunctions(browser);
        const userAgentNameInput = await getUserAgentName();

        this.setState({ userAgentNameInput });
    }

    async setUserAgentName(userAgentName: string) {
        this.setState({ userAgentNameLoading: true });
        const { setUserAgentName } = await initBGFunctions(browser);
        await setUserAgentName(userAgentName);
        this.loadUserAgentName();
        this.setState({ userAgentNameLoading: false, userAgentNameEdited: false });
    }

    async loadDynamicAdapter() {
        const { getDynamicAdapter } = await initBGFunctions(browser);
        const dynamicAdapterInput = await getDynamicAdapter();

        this.setState({ dynamicAdapterInput });
    }

    async setDynamicAdapter(dynamicAdapter: string) {
        this.setState({ dynamicAdapterLoading: true });
        const { setDynamicAdapter } = await initBGFunctions(browser);
        await setDynamicAdapter(dynamicAdapter);
        this.loadDynamicAdapter();
        this.setState({ dynamicAdapterLoading: false, dynamicAdapterEdited: false });
    }

    async checkUpdates() {
        const { getNewExtensionVersion } = await initBGFunctions(browser);
        const isUpdateAvailable = !!(await getNewExtensionVersion());
        this.setState({ isUpdateAvailable });
    }

    async loadIdentityContract() {
        const { getIdentityContract } = await initBGFunctions(browser);
        const identityInput = await getIdentityContract();
        this.setState({ identityInput });
    }

    async setIdentityContract(address: string) {
        this.setState({ identityLoading: true });
        const { setIdentityContract } = await initBGFunctions(browser);
        await setIdentityContract(address);
        this.loadIdentityContract();
        this.setState({ identityLoading: false, identityEdited: false });
    }

    async setErrorReporting(isActive: boolean) {
        const { setErrorReporting } = await initBGFunctions(browser);
        await setErrorReporting(isActive);
        this.loadErrorReporting();
    }

    async addRegistry(url: string) {
        const { addRegistry } = await initBGFunctions(browser);

        try {
            await addRegistry(url, false);
            this.setState({ registryInput: '' });
        } catch (err) {
            this.setState({ registryInputError: err.message });
        }

        this.loadRegistries();
    }

    async removeRegistry(url: string) {
        const { removeRegistry } = await initBGFunctions(browser);
        await removeRegistry(url);
        this.loadRegistries();
    }

    async addTrustedUser(account: string) {
        const { addTrustedUser } = await initBGFunctions(browser);

        try {
            await addTrustedUser(account);
            this.setState({ trustedUserInput: '' });
        } catch (err) {
            this.setState({ trustedUserInputError: err.message });
        }

        this.loadTrustedUsers();
    }

    async removeTrustedUser(account: string) {
        const { removeTrustedUser } = await initBGFunctions(browser);
        await removeTrustedUser(account);
        this.loadTrustedUsers();
    }

    async loadUserSettings() {
        this.setState({ userSettingsLoading: true });
        const { loadUserSettings } = await initBGFunctions(browser);

        try {
            await loadUserSettings(this.state.userSettingsInput);
            this.setState({ userSettingsInput: '' });
            location.reload();
        } catch (err) {
            this.setState({ userSettingsInputError: err.message });
        } finally {
            this.setState({ userSettingsLoading: false });
        }
    }

    async saveUserSettings() {
        this.setState({ userSettingsLoading: true });
        const { saveUserSettings } = await initBGFunctions(browser);

        try {
            const url = await saveUserSettings();
            this.setState({ userSettingsInput: url });
        } catch (err) {
            this.setState({ userSettingsInputError: err.message });
        } finally {
            this.setState({ userSettingsLoading: false });
        }
    }

    async _openEtherscan(address: string) {
        if (typeOfUri(address) === UriTypes.Ens) {
            const { resolveName } = await initBGFunctions(browser);
            const ethAddress = await resolveName(address);
            window.open(`https://rinkeby.etherscan.io/address/${ethAddress}`, '_blank');
        } else if (typeOfUri(address) === UriTypes.Ethereum) {
            window.open(`https://rinkeby.etherscan.io/address/${address}`, '_blank');
        } else if (typeOfUri(address) === UriTypes.Near) {
            window.open(`https://explorer.testnet.near.org/accounts/${address}`, '_blank');
        }
    }

    async enableRegistry(url: string) {
        const { enableRegistry } = await initBGFunctions(browser);
        await enableRegistry(url);
        this.loadRegistries();
    }

    async loadPreferedOverlayStorage() {
        const { getPreferedOverlayStorage } = await initBGFunctions(browser);
        const preferedOverlayStorage = await getPreferedOverlayStorage();
        this.setState({ preferedOverlayStorage });
    }

    async selectPreferedOverlayStorage(storage: string) {
        const { setPreferedOverlayStorage } = await initBGFunctions(browser);
        await setPreferedOverlayStorage(storage);
        this.loadPreferedOverlayStorage();
    }

    render() {
        const s = this.state;

        const { isLoading, registries, registryInput, registryInputError, trustedUsers, trustedUserInput, trustedUserInputError, devMode, errorReporting, autoBackup, popupInOverlay } = this.state;

        return (
            <React.Fragment>
                <Segment.Group className={(this.props.isOverlay) ? undefined : "internalTabSettings"} style={{ marginTop: (this.props.isOverlay) ? 0 : undefined }}>
                    <Segment loading={isLoading}>
                        <Header as='h4'>Profile</Header>
                        <ProfileDropdown 
                            currentProfileId={s.currentProfile} 
                            profiles={s.profiles.map(x => ({ id: x, text: x }))}
                            onRefresh={() => this.loadAll()}
                        />
                    </Segment>
                    
                    <Segment loading={isLoading}>
                        <Header as='h4'>Version</Header>
                        <div>
                            <a href='#' onClick={() => window.open(`https://github.com/dapplets/dapplet-extension/releases`, '_blank')}>
                                v{EXTENSION_VERSION}
                            </a>
                            {this.state.isUpdateAvailable ? <Icon title='New version is available' style={{ margin: '0 0 0 0.25em' }} color='orange' name='arrow up' /> : null}
                        </div>

                        <Header as='h4'>Public Registries</Header>
                        <Input
                            size='mini'
                            icon='code'
                            iconPosition='left'
                            action={{
                                content: 'Add',
                                size: 'mini',
                                onClick: () => this.addRegistry(registryInput),
                                disabled: !(isValidUrl(registryInput) && !registries.find(r => r.url === registryInput)),
                                color: 'blue'
                            }}
                            fluid
                            placeholder='NEAR or Ethereum address...'
                            value={registryInput}
                            onChange={(e) => this.setState({ registryInput: e.target.value, registryInputError: null })}
                            error={!!registryInputError}
                        />

                        {(registryInputError) ? <Label basic color='red' pointing>{registryInputError}</Label> : null}

                        <List divided relaxed size='small'>
                            {registries.map((r, i) => (
                                <List.Item key={i}>
                                    <List.Content floated='left'>
                                        <Checkbox radio checked={r.isEnabled} onClick={() => this.enableRegistry(r.url)}/>
                                    </List.Content>
                                    <List.Content floated='right'>
                                        <Icon link style={{ position: 'relative', top: '2px' }} color='red' name='close' onClick={() => this.removeRegistry(r.url)} />
                                    </List.Content>
                                    <List.Content>
                                        <a style={{ color: '#000', lineHeight: '1.4em' }} onClick={() => this.enableRegistry(r.url)}>{r.url}</a>
                                        {(r.isEnabled && r.error) ? <Popup
                                            trigger={
                                                <Label 
                                                    style={{ marginLeft: '6px', position: 'relative', top: '-1px', cursor: 'default' }}
                                                    size='mini' 
                                                    horizontal 
                                                    color='red'
                                                >
                                                    ERROR
                                                </Label>
                                            }
                                            content={r.error}
                                            size='mini'
                                        /> : null}
                                        
                                    </List.Content>
                                </List.Item>
                            ))}
                        </List>

                        <Header as='h4'>Trusted Users</Header>
                        <Input
                            size='mini'
                            icon='ethereum'
                            iconPosition='left'
                            action={{
                                content: 'Add',
                                size: 'mini',
                                onClick: () => this.addTrustedUser(trustedUserInput),
                                disabled: !(isValidUrl(trustedUserInput) && !registries.find(r => r.url === trustedUserInput)),
                                color: 'blue'
                            }}
                            fluid
                            placeholder='NEAR or Ethereum address...'
                            value={trustedUserInput}
                            onChange={(e) => this.setState({ trustedUserInput: e.target.value, trustedUserInputError: null })}
                            error={!!trustedUserInputError}
                        />

                        {(trustedUserInputError) ? <Label basic color='red' pointing>{trustedUserInputError}</Label> : null}

                        <List divided relaxed size='small'>
                            {trustedUsers.map((user, i) => (
                                <List.Item key={i}>
                                    <List.Content floated='right'>
                                        <Icon link color='red' name='close' onClick={() => this.removeTrustedUser(user.account)} />
                                    </List.Content>
                                    <List.Content><a style={{ color: '#000', lineHeight: '1.4em' }} onClick={() => this._openEtherscan(user.account)}>{user.account}</a></List.Content>
                                </List.Item>
                            ))}
                        </List>

                        <Header as='h5'>User Settings</Header>
                        <Input
                            size='mini'
                            fluid
                            placeholder='Swarm address...'
                            error={!!this.state.userSettingsInputError}
                            action
                            iconPosition='left'
                            loading={this.state.userSettingsLoading}
                        >
                            <Icon name='cog'></Icon>
                            <input
                                value={this.state.userSettingsInput}
                                onChange={(e) => this.setState({ userSettingsInput: e.target.value, userSettingsInputError: null })}
                            />
                            <Button size="mini" disabled={this.state.userSettingsLoading} onClick={() => this.loadUserSettings()}>Load</Button>
                            <Button size="mini" disabled={this.state.userSettingsLoading} color='blue' onClick={() => this.saveUserSettings()}>Save</Button>
                        </Input>

                        <Header as='h4'>Advanced</Header>

                        <Header as='h5'>Ethereum Provider</Header>
                        <Input
                            size='mini'
                            fluid
                            placeholder='Provider URL'
                            error={!!this.state.providerInputError || !isValidHttp(this.state.providerInput)}
                            action
                            iconPosition='left'
                            loading={this.state.providerLoading}
                            style={{ marginBottom: '15px' }}
                        >
                            <Icon name='server' />
                            <input
                                value={this.state.providerInput}
                                onChange={(e) => this.setState({ providerInput: e.target.value, providerInputError: null, providerEdited: true })}
                            />
                            <Button size='mini' disabled={this.state.providerLoading || !this.state.providerEdited || !isValidHttp(this.state.providerInput)} color='blue' onClick={() => this.setProvider(this.state.providerInput)}>Save</Button>
                        </Input>

                        <Header as='h5'>Swarm Gateway</Header>
                        <Input
                            size='mini'
                            fluid
                            placeholder='Gateway URL'
                            error={!!this.state.swarmGatewayInputError || !isValidHttp(this.state.swarmGatewayInput)}
                            action
                            iconPosition='left'
                            loading={this.state.swarmGatewayLoading}
                            style={{ marginBottom: '15px' }}
                        >
                            <Icon name='server' />
                            <input
                                value={this.state.swarmGatewayInput}
                                onChange={(e) => this.setState({ swarmGatewayInput: e.target.value, swarmGatewayInputError: null, swarmGatewayEdited: true })}
                            />
                            <Button size='mini' disabled={this.state.swarmGatewayLoading || !this.state.swarmGatewayEdited || !isValidHttp(this.state.swarmGatewayInput)} color='blue' onClick={() => this.setSwarmGateway(this.state.swarmGatewayInput)}>Save</Button>
                        </Input>

                        {/* <Header as='h5'>Identity Contract</Header>
                        <Input
                            size='mini'
                            fluid
                            placeholder='Contract address'
                            error={!!this.state.identityInputError || !isValidUrl(this.state.identityInput)}
                            action
                            iconPosition='left'
                            loading={this.state.identityLoading}
                            style={{ marginBottom: '15px' }}
                        >
                            <Icon name='users' />
                            <input
                                value={this.state.identityInput}
                                onChange={(e) => this.setState({ identityInput: e.target.value, identityInputError: null, identityEdited: true })}
                            />
                            <Button size='mini' disabled={this.state.identityLoading || !this.state.identityEdited || !isValidUrl(this.state.identityInput)} color='blue' onClick={() => this.setIdentityContract(this.state.identityInput)}>Save</Button>
                        </Input> */}

                        <div><Checkbox toggle label='Developer Mode' checked={devMode} onChange={() => this.setDevMode(!devMode)} style={{ marginBottom: 6 }} /></div>
                        <div><Checkbox toggle label='Open the popup in the overlay' checked={popupInOverlay} onChange={() => this.setPopupInOverlay(!popupInOverlay)} style={{ marginBottom: 6 }} /></div>
                        {/* <Checkbox toggle label='Modules backup' checked={autoBackup} onChange={() => this.setAutoBackup(!autoBackup)} style={{ marginBottom: 6 }} /><br /> */}
                        <div><Checkbox toggle label='Bug reports' checked={errorReporting} onChange={() => this.setErrorReporting(!errorReporting)} /></div>

                        <Header as='h5'>User Agent Name</Header>
                        <Input
                            size='mini'
                            fluid
                            placeholder='User agent name...'
                            error={!!this.state.userAgentNameInputError}
                            action
                            iconPosition='left'
                            loading={this.state.userAgentNameLoading}
                            style={{ marginBottom: '15px' }}
                        >
                            <Icon name='bug' />
                            <input
                                value={this.state.userAgentNameInput}
                                onChange={(e) => this.setState({ userAgentNameInput: e.target.value, userAgentNameInputError: null, userAgentNameEdited: true })}
                            />
                            <Button size='mini' disabled={this.state.userAgentNameLoading || !this.state.userAgentNameEdited} color='blue' onClick={() => this.setUserAgentName(this.state.userAgentNameInput)}>Save</Button>
                        </Input>

                        <Header as='h5'>Dynamic Adapter</Header>
                        <Input
                            size='mini'
                            fluid
                            placeholder='dynamic-adapter.dapplet-base.eth#default@latest'
                            error={!!this.state.dynamicAdapterInputError}
                            action
                            iconPosition='left'
                            loading={this.state.dynamicAdapterLoading}
                            style={{ marginBottom: '15px' }}
                        >
                            <Icon name='plug' />
                            <input
                                value={this.state.dynamicAdapterInput}
                                onChange={(e) => this.setState({ dynamicAdapterInput: e.target.value, dynamicAdapterInputError: null, dynamicAdapterEdited: true })}
                            />
                            <Button size='mini' disabled={this.state.dynamicAdapterLoading || !this.state.dynamicAdapterEdited || !parseModuleName(this.state.dynamicAdapterInput)} color='blue' onClick={() => this.setDynamicAdapter(this.state.dynamicAdapterInput)}>Save</Button>
                        </Input>

                        <Header as='h5'>Prefered Overlay Storage</Header>
                        <Menu size="mini" style={{ boxShadow: "none", border: "none" }}>
                            <Dropdown
                                fluid
                                basic
                                button
                                className="mini"
                                floating
                                text={s.preferedOverlayStorage}
                            >
                                <Dropdown.Menu style={{ maxHeight: "17rem", overflowY: "auto" }}>
                                <Dropdown.Divider style={{ margin: "unset" }} />
                                {[
                                    { id: 'centralized', text: 'Centralized'},
                                    { id: 'decentralized', text: 'Decentralized'}
                                ].map((x) => (
                                    <Dropdown.Item
                                        selected={x.id === s.preferedOverlayStorage}
                                        key={x.id}
                                        id={x.id}
                                        content={x.text}
                                        onClick={() => this.selectPreferedOverlayStorage(x.id)}
                                    />
                                ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </Menu>
                    </Segment>
                </Segment.Group>

            </React.Fragment>
        );
    }
}

export default Settings;
