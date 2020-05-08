import * as extension from 'extensionizer';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Form, Message, Image, Card, Modal, Input } from 'semantic-ui-react';
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
    owner: string;
    currentAccount: string;
    newOwner: string;
    newOwnerLoading: boolean;
    newOwnerDone: boolean;
    editLocation: string;
    editLocationLoading: boolean;
    editLocationDone: boolean;
}

class Index extends React.Component<IIndexProps, IIndexState> {
    private bus = new Bus();
    private transferOwnershipModal;
    private addLocationModal;

    constructor(props) {
        super(props);

        this.state = {
            manifest: null,
            loading: true,
            targetRegistry: null,
            targetStorage: 'swarm',
            message: null,
            registryKey: '',
            registryOptions: [],
            deployed: false,
            owner: null,
            currentAccount: null,
            newOwner: '',
            newOwnerLoading: false,
            newOwnerDone: false,
            editLocation: '',
            editLocationLoading: false,
            editLocationDone: false
        };

        this.bus.subscribe('data', ({ manifest }) => {
            this.setState({ manifest, loading: false });
        });

        this.transferOwnershipModal = React.createRef();
        this.addLocationModal = React.createRef();
    }

    async componentDidMount() {
        const { getRegistries } = await initBGFunctions(extension);
        const registries = await getRegistries();
        const prodRegistries = registries.filter(r => !r.isDev);
        this.setState({
            registryOptions: prodRegistries.map(r => ({
                key: r.url, text: r.url, value: r.url
            })),
            targetRegistry: prodRegistries[0]?.url || null
        });
        await this._updateOwnership();
    }

    private async _updateOwnership() {
        const { getOwnership, getAccounts } = await initBGFunctions(extension);
        const owner = await getOwnership(this.state.targetRegistry, this.state.manifest.name);
        const accounts = await getAccounts();

        this.setState({
            owner,
            currentAccount: accounts[0]
        });
    }

    private async _transferOwnership(address: string) {
        this.setState({ newOwnerLoading: true });
        const { transferOwnership } = await initBGFunctions(extension);
        await transferOwnership(this.state.targetRegistry, this.state.manifest.name, address);
        this.setState({ newOwnerLoading: false, newOwnerDone: true });
    }

    private async _addLocation(location: string) {
        this.setState({ editLocationLoading: true });
        const { addLocation } = await initBGFunctions(extension);
        await addLocation(this.state.targetRegistry, this.state.manifest.name, location);
        this.setState({ editLocationLoading: false, editLocationDone: true });
    }

    private async _removeLocation(location: string) {
        this.setState({ editLocationLoading: true });
        const { removeLocation } = await initBGFunctions(extension);
        await removeLocation(this.state.targetRegistry, this.state.manifest.name, location);
        this.setState({ editLocationLoading: false, editLocationDone: true });
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
            message, registryKey, registryOptions,
            owner, currentAccount, newOwner, editLocation: newLocation,
            newOwnerLoading, newOwnerDone, editLocationLoading: newLocationLoading,
            editLocationDone: newLocationDone
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

                {(owner !== null && owner !== currentAccount) ? (
                    <Message
                        error
                        header='Action Forbidden'
                        content={<React.Fragment>You can not deploy this module to the selected registry, because are not the module's owner.<br />Change account to {owner}</React.Fragment>}
                    />
                ) : null}

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
                            <strong>{manifest.name}#{manifest.branch}@{manifest.version}</strong><br />
                            Owner: <a href='#' onClick={() => window.open(`https://rinkeby.etherscan.io/address/${owner}`, '_blank')}>{owner}</a>
                        </Card.Description>
                    </Card.Content>
                    {(owner === currentAccount) ?
                        <Card.Content extra>
                            <div className='ui two buttons'>


                                <Modal closeOnEscape={false} closeOnDimmerClick={false} ref={this.transferOwnershipModal} dimmer='inverted' trigger={<Button basic color='grey'>Transfer ownership</Button>} centered={false}>
                                    <Modal.Header>Ownership Transfering</Modal.Header>
                                    <Modal.Content image>
                                        <Modal.Description>
                                            <Message warning>
                                                <Message.Header>IMPORTANT</Message.Header>
                                                Make sure the address is correct, otherwise you will lose control over the module.
                                            </Message>
                                            <Input
                                                fluid
                                                placeholder='New owner address...'
                                                value={newOwner}
                                                onChange={(e, data) => this.setState({ newOwner: data.value as string })}
                                            />
                                        </Modal.Description>
                                    </Modal.Content>
                                    <Modal.Actions>
                                        <Button basic onClick={() => {
                                            this.setState({ newOwner: '', newOwnerDone: false });
                                            this.transferOwnershipModal.current.handleClose();
                                            this._updateOwnership();
                                        }}>Cancel</Button>
                                        <Button 
                                            color='blue' 
                                            loading={newOwnerLoading}
                                            disabled={newOwnerLoading || newOwnerDone || !newOwner}
                                            onClick={() => this._transferOwnership(this.state.newOwner)}
                                        >{(!newOwnerDone) ? "Transfer" : "Done"}</Button>
                                    </Modal.Actions>
                                </Modal>


                                <Modal closeOnEscape={false} closeOnDimmerClick={false} ref={this.addLocationModal} dimmer='inverted' trigger={<Button basic color='grey'>Locations</Button>} centered={false}>
                                    <Modal.Header>Locations</Modal.Header>
                                    <Modal.Content image>
                                        <Modal.Description>
                                            <p>Here you can (un)bind the module to make it (un)accessible in modules list of website context.</p>
                                            <Input
                                                fluid
                                                placeholder='Location address (ex: example.com)'
                                                value={newLocation}
                                                onChange={(e, data) => this.setState({ editLocation: data.value as string })}
                                            />
                                        </Modal.Description>
                                    </Modal.Content>
                                    <Modal.Actions>
                                        <Button basic onClick={() => {
                                            this.setState({ editLocation: '', editLocationDone: false });
                                            this.addLocationModal.current.handleClose();
                                        }}>Cancel</Button>
                                        <Button 
                                            color='blue' 
                                            loading={newLocationLoading}
                                            disabled={newLocationLoading || newLocationDone || !newLocation}
                                            onClick={() => this._addLocation(this.state.editLocation)}
                                        >{(!newLocationDone) ? "Add" : "Done"}</Button>
                                        <Button 
                                            color='blue' 
                                            loading={newLocationLoading}
                                            disabled={newLocationLoading || newLocationDone || !newLocation}
                                            onClick={() => this._removeLocation(this.state.editLocation)}
                                        >{(!newLocationDone) ? "Remove" : "Done"}</Button>
                                    </Modal.Actions>
                                </Modal>


                            </div>
                        </Card.Content> : null}
                </Card>) : null}


                <Form loading={loading} onSubmit={() => this.deploySubmitHandler()}>

                    <Form.Select
                        required
                        label='Target Registry'
                        options={registryOptions}
                        placeholder='Target Registry'
                        value={targetRegistry}
                        onChange={(e, data) => {
                            this.setState({
                                targetRegistry: data.value as string
                            });
                            this._updateOwnership();
                        }}
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

                    {/* <Form.Input
                        //required
                        label="Access Key"
                        placeholder="Access Key"
                        value={registryKey}
                        onChange={(e) => this.setState({
                            registryKey: e.target.value
                        })}
                    /> */}

                    <Button submit="true" primary disabled={loading || deployed || (owner !== null && owner !== currentAccount)}>Deploy</Button>
                </Form>
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));