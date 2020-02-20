import * as extension from 'extensionizer';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Form, Message, Image, Card } from 'semantic-ui-react';
//import 'semantic-ui-css/semantic.min.css';
import NOLOGO_PNG from '../common/resources/no-logo.png';

import './index.scss';
import { Bus } from '../common/bus';
import Manifest from '../background/models/manifest';

interface IIndexProps { }

interface IIndexState {
    manifest: Manifest;
    loading: boolean;
    targetRegistry: string;
    targetStorage: string;
    message: {
        type: "negative" | "positive",
        header: string,
        message: string[]
    };
    registryKey: string;
    registryOptions: { key: string, value: string, text: string }[];
    deployed: boolean;
}

class Index extends React.Component<IIndexProps, IIndexState> {
    private bus = new Bus();

    constructor(props) {
        super(props);

        this.state = {
            manifest: null,
            loading: true,
            targetRegistry: 'https://test.dapplets.org/dapplet-base',
            targetStorage: 'swarm',
            message: null,
            registryKey: '',
            registryOptions: [
                {
                    key: 'https://test.dapplets.org/dapplet-base',
                    text: 'https://test.dapplets.org/dapplet-base',
                    value: 'https://test.dapplets.org/dapplet-base'
                }
            ],
            deployed: false
        };

        this.bus.subscribe('data', ({ manifest }) => {
            this.setState({ manifest, loading: false });
        });
    }

    async deploySubmitHandler() {
        this.setState({ loading: true });

        const { deployModule } = await initBGFunctions(extension);
        const { manifest, targetRegistry, targetStorage, registryKey } = this.state;

        try {
            const result = await deployModule(manifest, targetStorage, targetRegistry, registryKey);
            this.setState({
                message: {
                    type: 'positive',
                    header: 'Module was deployed',
                    message: [
                        `Manifest URL: ${result.manifestUrl}`,
                        `Script URL:  ${result.scriptUrl}`
                    ]
                },
                deployed: true
            });

        } catch (err) {
            this.setState({
                message: {
                    type: 'negative',
                    header: 'Publication error',
                    message: [err]
                }
            });
        } finally {
            this.setState({ loading: false });
        }
    }

    render() {
        const {
            manifest, loading, targetRegistry,
            targetStorage, deployed,
            message, registryKey, registryOptions
        } = this.state;

        return (
            <React.Fragment>
                <h2>Module Deployment</h2>

                {(message) ? (<Message
                    positive={message.type === 'positive'}
                    negative={message.type === 'negative'}
                >
                    <Message.Header>{message.header}</Message.Header>
                    {message.message.map((m, i) => <p key={i} style={{ overflowWrap: 'break-word' }}>{m}</p>)}
                </Message>) : null}

                {(manifest) ? (<Card fluid>
                    <Card.Content>
                        <Image
                            floated='right'
                            size='mini'
                            circular
                            src={manifest.icon || NOLOGO_PNG}
                        />
                        <Card.Header>{manifest.title}</Card.Header>
                        <Card.Meta>{manifest.type}</Card.Meta>
                        <Card.Description>
                            {manifest.description}<br />
                            {manifest.author}<br />
                            <strong>{manifest.name}#{manifest.branch}@{manifest.version}</strong>
                        </Card.Description>
                    </Card.Content>
                </Card>) : null}


                <Form loading={loading} onSubmit={() => this.deploySubmitHandler()}>
                    <Form.Select
                        required
                        label='Target Storage'
                        options={[
                            { key: 'swarm', text: 'Swarm', value: 'swarm' },
                            { key: 'test-registry', text: 'Test Registry', value: 'test-registry' }
                        ]}
                        placeholder='Target Storage'
                        value={targetStorage}
                        onChange={(e, data) => this.setState({
                            targetStorage: data.value as string
                        })}
                    />

                    <Form.Select
                        required
                        label='Target Registry'
                        options={registryOptions}
                        placeholder='Target Registry'
                        value={targetRegistry}
                        onChange={(e, data) => this.setState({
                            targetRegistry: data.value as string
                        })}
                        onAddItem={(e, { value }) => {
                            this.setState((prev) => ({
                                registryOptions: [{
                                    key: value as string,
                                    text: value as string,
                                    value: value as string
                                }, ...prev.registryOptions],
                            }))
                        }}
                        allowAdditions
                        selection
                        search
                    />

                    <Form.Input
                        required
                        label="Access Key"
                        placeholder="Access Key"
                        value={registryKey}
                        onChange={(e) => this.setState({
                            registryKey: e.target.value
                        })}
                    />

                    <Button submit="true" primary disabled={loading || deployed}>Deploy</Button>
                </Form>
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));