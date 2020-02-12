import * as React from "react";
import * as extension from 'extensionizer';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Button, Segment, Message, List, Label, Input, Icon, Image, Header } from "semantic-ui-react";

import { isValidUrl } from '../helpers';
import Manifest from "../../background/models/manifest";

interface IDeveloperProps { }

interface IDeveloperState {
    isLoading: boolean;
    registries: { url: string, isDev: boolean, isAvailable: boolean }[];
    registryInput: string;
    registryInputError: string;
    intro: {
        popupDeveloperWelcome: boolean;
    };
    modules: Manifest[];
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
        const { getRegistries, getAllDevModules } = await initBGFunctions(extension);
        const registries = await getRegistries();

        this.setState({
            isLoading: false,
            registries: registries.filter(r => r.isDev === true)
        });

        const modules = await getAllDevModules();

        this.setState({ modules });
    }

    async loadIntro() {
        const { getIntro } = await initBGFunctions(extension);
        const intro = await getIntro();
        this.setState({ intro });
    }

    async closeWelcomeIntro() {
        const { setIntro } = await initBGFunctions(extension);
        this.setState({ intro: { popupDeveloperWelcome: false } });
        await setIntro({ popupDeveloperWelcome: false });
    }

    async addRegistry(url: string) {
        const { addRegistry } = await initBGFunctions(extension);

        try {
            await addRegistry(url, true);
            this.setState({ registryInput: '' });
        } catch (msg) {
            this.setState({ registryInputError: msg });
        }

        this.loadRegistries();
    }

    async removeRegistry(url: string) {
        const { removeRegistry } = await initBGFunctions(extension);
        await removeRegistry(url);
        this.loadRegistries();
    }

    async deployModule(moduleManifest: Manifest) {
        extension.tabs.query({ currentWindow: true, active: true }, (tabs) => {
            var activeTab = tabs[0];
            extension.tabs.sendMessage(activeTab.id, {
                type: "OPEN_DEPLOY_OVERLAY",
                payload: {
                    manifest: moduleManifest
                }
            });
            window.close();
        });
    }

    render() {
        const { isLoading, registries, registryInput, registryInputError, intro, modules } = this.state;

        return (
            <React.Fragment>
                {(intro.popupDeveloperWelcome) ? (<Message info onDismiss={() => this.closeWelcomeIntro()}>
                    <Message.Header>Welcome to Development Mode!</Message.Header>
                    <p>Here you can connect to development servers to debug your modules, publish them to the public registry and sign using a paired wallet.</p>
                </Message>) : null}

                <Segment loading={isLoading} className="internalTabDeveloper">

                    <Header as='h4'>Registries</Header>
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
                                    <Label size='mini' horizontal color={(r.isAvailable) ? 'green' : 'red'}>{(r.isAvailable) ? 'ONLINE' : 'OFFLINE'}</Label>
                                </List.Content>
                                <List.Content floated='right'>
                                    <Icon link color='red' name='close' onClick={() => this.removeRegistry(r.url)} />
                                </List.Content>
                                <List.Content>{r.url}</List.Content>
                            </List.Item>
                        ))}
                    </List>

                    <Header as='h4'>Modules</Header>
                    <div style={{ maxHeight: 300, overflowY: 'scroll' }}>
                        {(modules.length > 0) ? <List divided relaxed verticalAlign='middle' size='small'>
                            {modules.map((m, i) => (
                                <List.Item key={i}>
                                    <Image avatar src={m.icon || '/no-logo.png'} />
                                    <List.Content>
                                        <List.Header>{m.name}</List.Header>
                                        {m.branch} v{m.version}
                                    </List.Content>
                                    <List.Content floated='right'>
                                        <Button size='mini' compact color='blue' onClick={() => this.deployModule(m)}>Deploy</Button>
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
