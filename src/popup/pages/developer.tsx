import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Popup, Button, Segment, Message, List, Label, Input, Icon, Image, Header, Checkbox } from "semantic-ui-react";
import NOLOGO_PNG from '../../common/resources/no-logo.png';

import { getCurrentTab, isValidUrl } from '../helpers';
import { StorageRef } from "../../background/registries/registry";
import ModuleInfo from "../../background/models/moduleInfo";
import VersionInfo from "../../background/models/versionInfo";
import { HoverLabel } from "../components/HoverLabel";
import { joinUrls } from "../../common/helpers";

interface IDeveloperProps {
    isOverlay: boolean;
}

interface IDeveloperState {
    isLoading: boolean;
    registries: {
        url: string,
        isDev: boolean,
        isAvailable: boolean,
        isEnabled: boolean,
        error: string
    }[];
    registryInput: string;
    registryInputError: string;
    intro: {
        popupDeveloperWelcome: boolean;
    };
    modules: { module: ModuleInfo, versions: VersionInfo[], isDeployed: boolean[] }[];
    swarmGatewayUrl: string;
}

class Developer extends React.Component<IDeveloperProps, IDeveloperState> {

    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            registries: [],
            registryInput: '',
            registryInputError: null,
            intro: {
                popupDeveloperWelcome: false
            },
            modules: [],
            swarmGatewayUrl: ''
        };
    }

    async componentDidMount() {
        await this.loadSwarmGateway();
        await Promise.all([this.loadRegistries(), this.loadIntro()]);
        const currentTab = await getCurrentTab();
        if (!currentTab) return;
        const currentUrl = currentTab.url;
        const urlEnding = currentUrl.split('/').reverse()[0];
        if (['index.json', 'dapplet.json'].includes(urlEnding)) {
          this.setState({ registryInput: currentUrl });
        }
    }

    async loadSwarmGateway() {
        const { getSwarmGateway } = await initBGFunctions(browser);
        const swarmGatewayUrl = await getSwarmGateway();
        this.setState({ swarmGatewayUrl });
    }

    async loadRegistries() {
        const { getRegistries, getAllDevModules } = await initBGFunctions(browser);

        const modules: { module: ModuleInfo, versions: VersionInfo[], isDeployed: boolean[] }[] = await getAllDevModules();
        this.setState({ modules });

        const registries = await getRegistries();
        this.setState({
            isLoading: false,
            registries: registries.filter(r => r.isDev === true)
        });
    }

    async loadIntro() {
        const { getIntro } = await initBGFunctions(browser);
        const intro = await getIntro();
        this.setState({ intro });
    }

    async closeWelcomeIntro() {
        const { setIntro } = await initBGFunctions(browser);
        this.setState({ intro: { popupDeveloperWelcome: false } });
        await setIntro({ popupDeveloperWelcome: false });
    }

    async addRegistry(url: string) {
        this.setState({ isLoading: true });
        const { addRegistry } = await initBGFunctions(browser);

        try {
            await addRegistry(url, true);
            this.setState({ registryInput: '' });
        } catch (msg) {
            this.setState({ registryInputError: msg.toString() });
        }

        this.loadRegistries();
    }

    async removeRegistry(url: string) {
        this.setState({ isLoading: true });
        const { removeRegistry } = await initBGFunctions(browser);
        await removeRegistry(url);
        this.loadRegistries();
    }

    async deployModule(mi: ModuleInfo, vi: VersionInfo) {
        const tab = await getCurrentTab();
        if (!tab) return;
        browser.tabs.sendMessage(tab.id, {
            type: "OPEN_DEPLOY_OVERLAY",
            payload: {
                mi, vi
            }
        });
        window.close();
    }

    async enableRegistry(url: string) {
        this.setState({ isLoading: true });
        const { enableRegistry } = await initBGFunctions(browser);
        await enableRegistry(url);
        this.loadRegistries();
    }

    async disableRegistry(url: string) {
        this.setState({ isLoading: true });
        const { disableRegistry } = await initBGFunctions(browser);
        await disableRegistry(url);
        this.loadRegistries();
    }

    render() {
        const { isLoading, registries, registryInput, registryInputError, intro, modules } = this.state;

        return (
            <div className={(this.props.isOverlay) ? undefined : "internalTabColumn"}>
                {(intro.popupDeveloperWelcome) ? (<Message info onDismiss={() => this.closeWelcomeIntro()} style={{ display: 'inline-table' }}>
                    <Message.Header>Welcome to Development Mode!</Message.Header>
                    <p>Here you can connect to development servers to debug modules, publish them to public registries using your wallet.</p>
                </Message>) : null}

                <Segment loading={isLoading} style={{ margin: 0, flex: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    <Header as='h4'>Development Servers</Header>
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
                        placeholder='Dev Registry URL...'
                        value={registryInput}
                        onChange={(e) => this.setState({ registryInput: e.target.value, registryInputError: null })}
                        error={!!registryInputError}
                    />

                    {(registryInputError) ? <Label basic color='red' pointing>{registryInputError}</Label> : null}

                    <List divided relaxed size='small'>
                        {registries.map((r, i) => (
                            <List.Item key={i}>
                                <List.Content floated='left'>
                                    {(r.isEnabled) ?
                                        ((!r.error) ?
                                            <HoverLabel style={{ cursor: 'pointer', width: '56px', textAlign: 'center' }} size="mini" horizontal color="green" hoverText="DISABLE" hoverColor="red" onClick={() => this.disableRegistry(r.url)}>ENABLED</HoverLabel> :
                                            <Popup
                                                trigger={<HoverLabel style={{ cursor: 'pointer', width: '56px', textAlign: 'center' }} size="mini" horizontal color="red" hoverText="DISABLE" hoverColor="red" onClick={() => this.disableRegistry(r.url)}>ERROR</HoverLabel>}
                                                content={r.error}
                                                size='mini'
                                            />) :
                                        <HoverLabel style={{ cursor: 'pointer', width: '56px', textAlign: 'center' }} size="mini" horizontal color="grey" hoverText="ENABLE" hoverColor="green" onClick={() => this.enableRegistry(r.url)}>DISABLED</HoverLabel>
                                    }
                                </List.Content>
                                <List.Content floated='right'>
                                    <Icon link color='red' name='close' onClick={() => this.removeRegistry(r.url)} />
                                </List.Content>
                                <List.Content><a style={{ color: '#000' }} onClick={() => window.open(r.url, '_blank')}>{r.url}</a></List.Content>
                            </List.Item>
                        ))}
                    </List>

                    <Header as='h4' style={{ marginTop: '0.5em' }}>Modules</Header>
                    <div style={{ overflowY: 'auto', flex: 'auto' }}>
                        {(modules.length > 0) ? <List divided relaxed verticalAlign='middle' size='small'>
                            {modules.map((m, i) => (
                                <List.Item key={i}>
                                    <List.Content floated='left' style={{ position: 'relative' }}>
                                        <Image avatar src={(m.module.icon && m.module.icon.uris.length > 0) ? ((m.module.icon.uris?.[0]?.indexOf('bzz:/') !== -1) ? joinUrls(this.state.swarmGatewayUrl, 'bzz/' + (m.module.icon as StorageRef).uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]) : (m.module.icon as StorageRef).uris?.[0]) : NOLOGO_PNG} />
                                        {(m.isDeployed?.[0] === true) ? <Label color='green' floating style={{ padding: '4px', top: '18px', left: '18px' }} /> : null}
                                    </List.Content>
                                    <List.Content floated='right'>
                                        <Button size='mini' compact color='blue' onClick={() => this.deployModule(m.module, m.versions[0])}>Deploy</Button>
                                    </List.Content>
                                    <List.Content>
                                        <List.Header>
                                            {m.module.name}
                                            {(m.isDeployed?.[0] === false) ? <Label style={{ marginLeft: '4px' }} size='mini' horizontal >NOT DEPLOYED</Label> : null}
                                        </List.Header>
                                        {m.versions[0].branch} v{m.versions[0].version}
                                    </List.Content>
                                </List.Item>
                            ))}
                        </List> : (<div>No available development modules.</div>)}
                    </div>
                </Segment>

            </div>
        );
    }
}

export default Developer;
