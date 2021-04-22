import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Popup, Segment, List, Label, Input, Checkbox, Icon, Header, Button } from "semantic-ui-react";
import { isValidHttp, isValidUrl } from '../helpers';
import { typeOfUri, UriTypes } from '../../common/helpers';

interface ISettingsProps {
    devMode: boolean;
    updateTabs: () => Promise<void>;
    isOverlay: boolean;
}

interface ISettingsState {
    isLoading: boolean;
    connected: boolean;

    registries: { url: string, isDev: boolean, isAvailable: boolean, error: string }[];
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
}

class Settings extends React.Component<ISettingsProps, ISettingsState> {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            connected: false,
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
            userAgentNameEdited: false
        };
    }

    async componentDidMount() {
        await Promise.all([
            this.loadRegistries(),
            this.loadDevMode(),
            this.loadTrustedUsers(),
            this.loadAutoBackup(),
            this.loadErrorReporting(),
            this.loadPopupInOverlay(),
            this.checkUpdates(),
            this.loadProvider(),
            this.loadIdentityContract(),
            this.loadUserAgentId(),
            this.loadUserAgentName()
        ]);
        this.setState({ isLoading: false });
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

    async checkUpdates() {
        const { isExtensionUpdateAvailable } = await initBGFunctions(browser);
        const isUpdateAvailable = await isExtensionUpdateAvailable();
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
        } else {
            window.open(`https://rinkeby.etherscan.io/address/${address}`, '_blank');
        }
    }

    render() {
        const { isLoading, registries, registryInput, registryInputError, trustedUsers, trustedUserInput, trustedUserInputError, devMode, errorReporting, autoBackup, popupInOverlay } = this.state;

        return (
            <React.Fragment>
                <Segment loading={isLoading} className={(this.props.isOverlay) ? undefined : "internalTabSettings"} style={{ marginTop: (this.props.isOverlay) ? 0 : undefined }}>

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
                        placeholder='ENS or 0x address...'
                        value={registryInput}
                        onChange={(e) => this.setState({ registryInput: e.target.value, registryInputError: null })}
                        error={!!registryInputError}
                    />

                    {(registryInputError) ? <Label basic color='red' pointing>{registryInputError}</Label> : null}

                    <List divided relaxed size='small'>
                        {registries.map((r, i) => (
                            <List.Item key={i}>
                                <List.Content floated='left'>
                                    <Popup
                                        trigger={<Label size='mini' horizontal color={(r.isAvailable) ? 'green' : 'red'}>{(r.isAvailable) ? 'ONLINE' : (r.error) ? 'ERROR' : 'OFFLINE'}</Label>}
                                        content={r.error || 'Ready'}
                                        size='mini'
                                    />
                                </List.Content>
                                <List.Content floated='right'>
                                    <Icon link color='red' name='close' onClick={() => this.removeRegistry(r.url)} />
                                </List.Content>
                                <List.Content><a style={{ color: '#000', lineHeight: '1.4em' }} onClick={() => this._openEtherscan(r.url)}>{r.url}</a></List.Content>
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
                        placeholder='ENS or 0x address...'
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
                        placeholder='Swarm Address...'
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
                        <Button.Group size='mini'>
                            <Button disabled={this.state.userSettingsLoading} onClick={() => this.loadUserSettings()}>Load</Button>
                            <Button disabled={this.state.userSettingsLoading} color='blue' onClick={() => this.saveUserSettings()}>Save</Button>
                        </Button.Group>
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

                    <Header as='h5'>Identity Contract</Header>
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
                    </Input>

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

                    <Header as='h4'>About</Header>
                    <div>
                        <a href='#' onClick={() => window.open(`https://github.com/dapplets/dapplet-extension/releases`, '_blank')}>
                            v{EXTENSION_VERSION}
                        </a>
                        {this.state.isUpdateAvailable ? <Icon title='New version is available' style={{ margin: '0 0 0 0.25em' }} color='orange' name='arrow up' /> : null}
                    </div>
                </Segment>

            </React.Fragment>
        );
    }
}

export default Settings;
