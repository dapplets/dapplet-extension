import * as React from "react";
import * as extension from 'extensionizer';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Segment, List, Label, Input, Checkbox, Icon, Header } from "semantic-ui-react";

import { isValidUrl } from '../helpers';

interface ISettingsProps {

}

interface ISettingsState {
    isLoading: boolean;
    connected: boolean;
    registries: { url: string, isDev: boolean }[];
    registryInput: string;
    registryInputError: string;
}

const OPTIONS = [{
    key: 'https://test.dapplets.org/dapplet-base',
    text: 'https://test.dapplets.org/dapplet-base',
    value: 'https://test.dapplets.org/dapplet-base'
}, {
    key: 'https://localhost:8080/index.json',
    text: 'https://localhost:8080/index.json',
    value: 'https://localhost:8080/index.json'
}];

class Settings extends React.Component<ISettingsProps, ISettingsState> {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            connected: false,
            registries: [],
            registryInput: '',
            registryInputError: null,
        };
    }

    async componentDidMount() {
        this.loadRegistries();
    }

    async loadRegistries() {
        const { getRegistries } = await initBGFunctions(extension);
        const registries = await getRegistries();

        this.setState({
            isLoading: false,
            registries: registries.filter(r => r.isDev === false)
        });
    }

    async addRegistry(url: string) {
        const { addRegistry } = await initBGFunctions(extension);

        try {
            await addRegistry(url, false);
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

    render() {
        const { isLoading, registries, registryInput, registryInputError } = this.state;

        return (
            <React.Fragment>
                <Segment loading={isLoading} className="internalTabSettings">

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
                        placeholder='Public Registry URL...'
                        value={registryInput}
                        onChange={(e) => this.setState({ registryInput: e.target.value, registryInputError: null })}
                        error={!!registryInputError}
                    />

                    {(registryInputError) ? <Label basic color='red' pointing>{registryInputError}</Label> : null}

                    <List divided relaxed size='small'>
                        {registries.map((r, i) => (
                            <List.Item key={i}>
                                <List.Content floated='right'>
                                    <Icon link color='red' name='close' onClick={() => this.removeRegistry(r.url)} />
                                </List.Content>
                                <List.Content>{r.url}</List.Content>
                            </List.Item>
                        ))}
                    </List>

                    <Header as='h4'>Advanced</Header>
                    <Checkbox toggle label='Development Mode' />
                </Segment>

            </React.Fragment>
        );
    }
}

export default Settings;
