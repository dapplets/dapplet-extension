import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Popup, Button, Segment, Message, List, Label, Input, Icon, Image, Header } from "semantic-ui-react";
import NOLOGO_PNG from '../../common/resources/no-logo.png';

import { isValidUrl } from '../helpers';
import { StorageRef } from "../../background/registries/registry";
import ModuleInfo from "../../background/models/moduleInfo";
import VersionInfo from "../../background/models/versionInfo";

interface IDeveloperProps { }

interface IDeveloperState {
    isLoading: boolean;
    registries: {
        url: string,
        isDev: boolean,
        isAvailable: boolean,
        error: string
    }[];
    registryInput: string;
    registryInputError: string;
    intro: {
        popupDeveloperWelcome: boolean;
    };
    modules: { module: ModuleInfo, versions: VersionInfo[], isDeployed: boolean[] }[];
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
            modules: []
        };
    }

    componentDidMount() {
        this.loadRegistries();
        this.loadIntro();
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
            this.setState({ registryInputError: msg });
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
        const tabs = await browser.tabs.query({ currentWindow: true, active: true });
        const activeTab = tabs[0];
        browser.tabs.sendMessage(activeTab.id, {
            type: "OPEN_DEPLOY_OVERLAY",
            payload: {
                mi, vi
            }
        });
        window.close();
    }

    render() {
        const { isLoading, registries, registryInput, registryInputError, intro, modules } = this.state;

        return (
            <React.Fragment>
                {(intro.popupDeveloperWelcome) ? (<Message info onDismiss={() => this.closeWelcomeIntro()}>
                    <Message.Header>Welcome to Development Mode!</Message.Header>
                    <p>Here you can connect to development servers to debug modules, publish them to public registries using your wallet.</p>
                </Message>) : null}

                <Segment loading={isLoading} className="internalTabDeveloper">

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
                                    <Popup
                                        trigger={<Label size='mini' horizontal color={(r.isAvailable) ? 'green' : 'red'}>{(r.isAvailable) ? 'ONLINE' : (r.error) ? 'ERROR' : 'OFFLINE'}</Label>}
                                        content={r.error || 'Ready'}
                                        size='mini'
                                    />
                                </List.Content>
                                <List.Content floated='right'>
                                    <Icon link color='red' name='close' onClick={() => this.removeRegistry(r.url)} />
                                </List.Content>
                                <List.Content><a style={{ color: '#000' }} onClick={() => window.open(r.url, '_blank')}>{r.url}</a></List.Content>
                            </List.Item>
                        ))}
                    </List>

                    <Header as='h4'>Modules</Header>
                    <div style={{ maxHeight: 300, overflowY: 'scroll' }}>
                        {(modules.length > 0) ? <List divided relaxed verticalAlign='middle' size='small'>
                            {modules.map((m, i) => (
                                <List.Item key={i}>
                                    <List.Content floated='left' style={{ position: 'relative' }}>
                                        <Image avatar src={(m.module.icon && m.module.icon.uris.length > 0) ? ((m.module.icon.uris?.[0]?.indexOf('bzz:/') !== -1) ? 'https://swarm-gateways.net/' + (m.module.icon as StorageRef).uris?.[0] : (m.module.icon as StorageRef).uris?.[0]) : NOLOGO_PNG} />
                                        {(m.isDeployed?.[0] === true) ? <Label color='green' floating style={{ padding: '4px', top: '18px', left: '18px' }} /> : null}
                                    </List.Content>
                                    <List.Content floated='right'>
                                        <Button size='mini' compact color='blue' onClick={() => this.deployModule(m.module, m.versions[0])}>Deploy</Button>
                                    </List.Content>
                                    <List.Content>
                                        <List.Header>
                                            {m.module.name}
                                            {(m.isDeployed?.[0] === false) ? <Label size='mini' horizontal >NOT DEPLOYED</Label> : null}
                                        </List.Header>
                                        {m.versions[0].branch} v{m.versions[0].version}
                                    </List.Content>
                                </List.Item>
                            ))}
                        </List> : (<div>No available development modules.</div>)}
                    </div>
                </Segment>

            </React.Fragment>
        );
    }
}

export default Developer;
