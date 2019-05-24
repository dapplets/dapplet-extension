import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { List, Button, Form, Icon, Segment, Image, Message } from "semantic-ui-react";
import store from "../store";

interface IDevProps {

}

interface IDevState {
    scripts: any[];
    configUrl: any;
}

class Dev extends React.Component<IDevProps, IDevState> {
    constructor(props) {
        super(props);

        this.state = {
            scripts: [],
            configUrl: ''
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { getDevScriptsByHostname } = backgroundFunctions;

        const scripts = await getDevScriptsByHostname(store.currentHostname) || [];

        this.setState({
            scripts: scripts
        });
    }

    handleSubmit = async () => {
        const { configUrl } = this.state;

        if (configUrl) {
            await this.handleSetConfig();
        } else {
            await this.handleClearConfig();
        }

        this.setState({
            configUrl: ''
        })

        await this.componentDidMount();
    }

    handleSetConfig = async () => {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { setDevConfig } = backgroundFunctions;
        const { configUrl } = this.state;
        await setDevConfig(configUrl, store.currentHostname);
    }

    handleClearConfig = async () => {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { clearDevConfig } = backgroundFunctions;
        await clearDevConfig(store.currentHostname);
    }

    render() {
        const { scripts, configUrl } = this.state;

        return (
            <React.Fragment>
                {(scripts.length == 0) ? (
                    <Message>
                        <Message.Header>Development mode</Message.Header>
                        <p>You can add your script to start development. Enter the script ID and its URL.</p>
                    </Message>
                ) : null}
                <Segment>
                    <Form onSubmit={this.handleSubmit}>
                        <Form.Input
                            placeholder='Dev Config URL'
                            size='mini'
                            value={configUrl}
                            onChange={(e, { value }) => this.setState({ configUrl: value })}
                            action={(
                                <Button
                                    content={configUrl ? 'Set' : 'Clear'}
                                    size='mini'
                                    color={configUrl ? 'teal' : 'red'}
                                    type='submit'
                                />
                            )}
                        />
                    </Form>
                </Segment>
                {(scripts.length > 0) ? (<Segment>
                    <List divided verticalAlign='middle'>
                        {scripts.map(script => (
                            <List.Item key={script.id}>
                                <Image avatar src={script.icon || '/icon48.png'} />
                                <List.Content>
                                    <List.Header as='a' href={script.devUrl}>{script.id}</List.Header>
                                    <List.Description>{script.type}</List.Description>
                                </List.Content>
                            </List.Item>
                        ))}
                    </List>
                </Segment>) : null}

            </React.Fragment>
        );
    }
}

export default Dev;
