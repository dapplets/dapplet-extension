import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { List, Button, Form, Segment, Image, Message } from "semantic-ui-react";
import store from "../store";

interface IDevProps {

}

interface IDevState {
    features: any[];
    configUrl: any;
    isLoading: boolean;
    error: string;
    connected: boolean;
}

class Dev extends React.Component<IDevProps, IDevState> {
    constructor(props) {
        super(props);

        this.state = {
            features: [],
            configUrl: '',
            isLoading: true,
            error: null,
            connected: false
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { getFeaturesByHostname, getGlobalConfig } = backgroundFunctions;

        try {
            const features = await getFeaturesByHostname(store.currentHostname) || [];
            const config = await getGlobalConfig();

            this.setState({
                features: features.filter(f => f.isDev == true),
                configUrl: config.devConfigUrl,
                isLoading: false,
                connected: !!config.devConfigUrl
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
        const backgroundFunctions = await initBGFunctions(chrome);
        const { getGlobalConfig, setGlobalConfig } = backgroundFunctions;

        const { configUrl } = this.state;

        this.setState({ isLoading: true });

        const config = await getGlobalConfig();
        config.devConfigUrl = configUrl;
        await setGlobalConfig(config);

        await this.componentDidMount();
    }

    render() {
        const { configUrl, isLoading, error, connected } = this.state;

        return (
            <React.Fragment>
                <Segment loading={isLoading}>

                    <Form onSubmit={this.handleSubmit}>
                        <Form.Input
                            placeholder='Type URL to index.json'
                            size='mini'
                            value={configUrl}
                            label='Dev Config URL'
                            onChange={(e, { value }) => this.setState({ configUrl: value })}
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

export default Dev;
