import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { List, Button, Form, Icon, Segment, Image, Message } from "semantic-ui-react";
import store from "../store";

interface IDevProps {

}

interface IDevState {
    scripts: any[];
    scriptId: any;
    scriptUrl: any;
}

class Dev extends React.Component<IDevProps, IDevState> {
    constructor(props) {
        super(props);

        this.state = {
            scripts: [],
            scriptId: '',
            scriptUrl: ''
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

    handleAdd = async () => {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { addDevScript } = backgroundFunctions;

        const { scriptId, scriptUrl } = this.state;

        await addDevScript(scriptId, scriptUrl, store.currentHostname);
        await this.componentDidMount();
    }

    handleDelete = async (id) => {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { deleteDevScript } = backgroundFunctions;

        await deleteDevScript(id, store.currentHostname);
        await this.componentDidMount();
    }

    render() {
        const { scripts, scriptId, scriptUrl } = this.state;

        return (
            <React.Fragment>
                {(scripts.length == 0) ? (
                    <Message>
                        <Message.Header>Development mode</Message.Header>
                        <p>You can add your script to start development. Enter the script ID and its URL.</p>
                    </Message>
                ) : null}
                <Segment>
                    <Form onSubmit={this.handleAdd}>
                        <Form.Input
                            placeholder='Script ID'
                            size='mini'
                            value={scriptId}
                            onChange={(e, { value }) => this.setState({ scriptId: value })}
                        />
                        <Form.Input
                            placeholder='Script URL'
                            size='mini'
                            value={scriptUrl}
                            onChange={(e, { value }) => this.setState({ scriptUrl: value })}
                            action={(
                                <Button
                                    content='Add'
                                    size='mini'
                                    color='teal'
                                    type='submit'
                                    disabled={!scriptUrl || !scriptId}
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
                                <List.Content floated='right'>
                                    <Button icon size='mini' negative onClick={() => this.handleDelete(script.id)}>
                                        <Icon name='delete' />
                                    </Button>
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
