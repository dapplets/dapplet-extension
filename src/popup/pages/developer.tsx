import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Popup, Button, Segment, Message, List, Label, Input, Icon, Image, Header, Checkbox } from "semantic-ui-react";
import NOLOGO_PNG from '../../common/resources/no-logo.png';

import { isValidUrl } from '../helpers';
import { StorageRef } from "../../background/registries/registry";
import ModuleInfo from "../../background/models/moduleInfo";
import VersionInfo from "../../background/models/versionInfo";
import { HoverLabel } from "../components/HoverLabel";
import { groupBy, joinUrls } from "../../common/helpers";
import { DevModulesList } from "../components/DevModulesList";

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
        const { getCurrentTab } = await initBGFunctions(browser);
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
        const { openDeployOverlay } = await initBGFunctions(browser);
        await openDeployOverlay(mi, vi);
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

    async onCreateModuleHandler() {
        const { openDeployOverlay } = await initBGFunctions(browser);
        await openDeployOverlay(null, null);
        window.close();
    }

    render() {
        const { isLoading, registries, registryInput, registryInputError, intro, modules } = this.state;
        const groupedModules = groupBy(modules, x => x.module.registryUrl);
        
        return (
            <Segment.Group className={(this.props.isOverlay) ? undefined : "internalTabSettings"} style={{ marginTop: (this.props.isOverlay) ? 0 : undefined }}>
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
                </Segment>

                <Segment disabled={isLoading}>
                    <div>
                        <Button
                            size="mini"
                            compact
                            color="blue"
                            onClick={this.onCreateModuleHandler.bind(this)}
                        >
                            Create Module
                        </Button>
                    </div>
                </Segment>

                <Segment disabled={isLoading}>
                    <Header as='h4'>Your Modules</Header>
                    <div style={{ flex: 'auto' }}>
                        {(modules.length > 0) ? 
                            Object.entries(groupedModules).map(([registryUrl, modules]) => (
                                <div style={{ marginBottom: '1.5em' }} key={registryUrl}>
                                    <Header as='h5'>{registryUrl}</Header>
                                    {(modules.length > 0) ? <DevModulesList modules={modules} onDetailsClick={this.deployModule.bind(this)} /> : (<div>No available development modules.</div>)}
                                </div>
                            )) : 
                            (<div>No available development modules.</div>)
                        }
                    </div>
                </Segment>

            </Segment.Group>
        );
    }
}

export default Developer;
