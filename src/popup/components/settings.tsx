import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { List, Button, Form, Segment, Image, Message } from "semantic-ui-react";
import store from "../store";
import * as extension from 'extensionizer';

interface ISettingsProps {

}

interface ISettingsState {
    features: any[];
    registryUrl: any;
    isLoading: boolean;
    error: string;
    connected: boolean;
}

class Settings extends React.Component<ISettingsProps, ISettingsState> {
    constructor(props) {
        super(props);

        this.state = {
            features: [],
            registryUrl: '',
            isLoading: true,
            error: null,
            connected: false
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(extension);
        const { getFeaturesByHostname, getGlobalConfig } = backgroundFunctions;

        try {
            const features = await getFeaturesByHostname(store.currentHostname) || [];
            const config = await getGlobalConfig();

            this.setState({
                features: features.filter(f => f.isDev == true),
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

                    <Form onSubmit={this.handleSubmit}>
                        <Form.Input
                            placeholder='Type URL to index.json'
                            size='mini'
                            value={registryUrl}
                            label='Registry URL'
                            onChange={(e, { value }) => this.setState({ registryUrl: value })}
                            action={(
                                <React.Fragment>
                                    <Button
                                        content='Set'
                                        size='mini'
                                        color='teal'
                                        type='submit'
                                    />
                                </React.Fragment>
                            )}
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
