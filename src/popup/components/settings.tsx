import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as extension from 'extensionizer';

import { Button, Form, Segment, Message, Dropdown } from "semantic-ui-react";

interface ISettingsProps {

}

interface ISettingsState {
    registryUrl: any;
    isLoading: boolean;
    error: string;
    connected: boolean;
    registries: string[];
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
            registryUrl: '',
            isLoading: true,
            error: null,
            connected: false,
            registries: []
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(extension);
        const { getGlobalConfig } = backgroundFunctions;

        try {
            const config = await getGlobalConfig();

            this.setState({
                registryUrl: config.registryUrl,
                isLoading: false,
                connected: !!config.registryUrl,
                registries: config.registries
            });
        } catch {
            this.setState({
                isLoading: false,
                error: "The registry is not available.",
                connected: false
            });
        }
    }

    async setNewUrl(url: string) {
        this.setState({ isLoading: true, registryUrl: url });

        const backgroundFunctions = await initBGFunctions(extension);
        const { getGlobalConfig, setGlobalConfig } = backgroundFunctions;

        const config = await getGlobalConfig();
        config.registryUrl = url;
        await setGlobalConfig(config);

        await this.componentDidMount();
    }

    async addNewUrl(url: string) {
        this.setState({ isLoading: true });

        const backgroundFunctions = await initBGFunctions(extension);
        const { getGlobalConfig, setGlobalConfig } = backgroundFunctions;
        const config = await getGlobalConfig();

        if (!config.registries) config.registries = [];
        config.registries.push(url);

        await setGlobalConfig(config);

        await this.componentDidMount();
    }

    render() {
        const { registryUrl, isLoading, error, connected, registries } = this.state;

        return (
            <React.Fragment>
                <Segment loading={isLoading} className="internalTabSettings">

                    <p><b>Registry URL</b></p>
                    <Dropdown
                        options={registries.map(r => ({ key: r, text: r, value: r }))}
                        placeholder='Type URL to Registry'
                        search
                        selection
                        fluid
                        allowAdditions
                        value={registryUrl}
                        key={registryUrl}
                        text={registryUrl}
                        onAddItem={(e, { value }) => this.addNewUrl(value as string)}
                        onChange={(e, { value }) => this.setNewUrl(value as string)}
                        size='mini'
                    />

                    {(!isLoading) && (
                        (error) ? (<Message floating negative>{error}</Message>) : (
                            (connected) ? (<Message floating success>Connected to the registry successfully.</Message>) :
                                (<Message floating warning>Enter the URL address of the registry.</Message>)
                        )
                    )}
                </Segment>

            </React.Fragment>
        );
    }
}

export default Settings;
