import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { List, Button, Form, Icon, Input, Divider, Dropdown } from "semantic-ui-react";
import store from "../store";

interface IDevProps {

}

interface IDevState {
    injectors: any[];
    scriptId: any;
    scriptUrl: any;
}

class Dev extends React.Component<IDevProps, IDevState> {
    constructor(props) {
        super(props);

        this.state = {
            injectors: [],
            scriptId: '',
            scriptUrl: ''
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { getFeaturesByHostname } = backgroundFunctions;

        const injectors = await getFeaturesByHostname(store.currentHostname, true) || [];

        this.setState({
            injectors: injectors
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
        const { injectors, scriptId, scriptUrl } = this.state;

        return (
            <React.Fragment>
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
                {(injectors.length > 0) ? (<List divided verticalAlign='middle'>
                    {injectors.map(injector => (
                        <List.Item key={injector.id}>
                            <List.Content floated='right'>
                                <Button icon basic size='mini' onClick={() => this.handleDelete(injector.id)}>
                                    <Icon name='delete' />
                                </Button>
                            </List.Content>
                            <List.Content>
                                <List.Header>{injector.name}</List.Header>
                                <List.Description>{injector.id}<br />{injector.devUrl}</List.Description>
                            </List.Content>
                        </List.Item>
                    ))}
                </List>) : null}

            </React.Fragment>
        );
    }
}

export default Dev;
