import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { List, Button, Form, Segment, Image, Message } from "semantic-ui-react";
import store from "../store";

interface IDevProps {

}

interface IDevState {
    scripts: any[];
    configUrl: any;
    isLoading: boolean;
}

class Dev extends React.Component<IDevProps, IDevState> {
    constructor(props) {
        super(props);

        this.state = {
            scripts: [],
            configUrl: '',
            isLoading: true
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { getDevScriptsByHostname, getGlobalConfig } = backgroundFunctions;

        const scripts = await getDevScriptsByHostname(store.currentHostname) || [];
        const config = await getGlobalConfig();

        this.setState({
            scripts: scripts,
            configUrl: config.devConfigUrl,
            isLoading: false
        });
    }

    handleSubmit = async () => {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { getGlobalConfig, setGlobalConfig } = backgroundFunctions;

        const { configUrl } = this.state;

        const config = await getGlobalConfig();
        config.devConfigUrl = configUrl;
        await setGlobalConfig(config);

        await this.componentDidMount();
    }

    render() {
        const { scripts, configUrl, isLoading } = this.state;

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

                    {scripts.length > 0 ?
                        (<List divided verticalAlign='middle'>
                            {scripts.map(script => (
                                <List.Item key={script.id}>
                                    <Image avatar src={script.icon || '/icon48.png'} />
                                    <List.Content>
                                        <List.Header>{script.id}</List.Header>
                                    </List.Content>
                                </List.Item>
                            ))}
                        </List>) :
                        (<Message>
                            <Message.Header>No dev features found</Message.Header>
                            <p>Add script ID to {store.currentHostname} section of JSON configuration file</p>
                        </Message>)}
                </Segment>

            </React.Fragment>
        );
    }
}

export default Dev;
