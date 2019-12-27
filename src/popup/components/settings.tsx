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
            connected: false
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
                connected: !!config.registryUrl
            });
        } catch {
            this.setState({
                isLoading: false,
                error: "The registry is not available.",
                connected: false
            });
        }
    }

    handleSubmit = async () => {
        const backgroundFunctions = await initBGFunctions(extension);
        const { getGlobalConfig, setGlobalConfig } = backgroundFunctions;

        const { registryUrl } = this.state;

        this.setState({ isLoading: true });

        const config = await getGlobalConfig();
        config.registryUrl = registryUrl;
        await setGlobalConfig(config);

        await this.componentDidMount();
    }

    render() {
        const { registryUrl, isLoading, error, connected } = this.state;

        return (
            <React.Fragment>
                <Segment loading={isLoading} className="internalTab">

                    <Form>
                        <Dropdown
                            onChange={(e, { value }) => { this.setState({ registryUrl: value }); this.handleSubmit(); }}
                            label='Registry URL'
                            value={registryUrl}
                            placeholder='Type URL to index.json'
                            size='mini'
                            fluid
                            selection
                            options={OPTIONS}
                            defaultValue='https://test.dapplets.org/dapplet-base'
                        />
                    </Form>

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
