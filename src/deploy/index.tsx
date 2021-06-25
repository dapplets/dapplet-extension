import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Form, Message, Image, Card, Modal, Input, Icon, List } from 'semantic-ui-react';
//import 'semantic-ui-css/semantic.min.css';
import NOLOGO_PNG from '../common/resources/no-logo.png';

import './index.scss';
import { Bus } from '../common/bus';
import ModuleInfo from '../background/models/moduleInfo';
import VersionInfo from '../background/models/versionInfo';
import * as tracing from '../common/tracing';
import { ChainTypes, DefaultSigners } from "../common/types";
import { typeOfUri, chainByUri, joinUrls } from "../common/helpers";

tracing.startTracing();

enum DeploymentStatus {
    Unknown,
    Deployed,
    NotDeployed,
    NewModule
}

interface IIndexProps { }

interface IIndexState {
    mi: ModuleInfo;
    vi: VersionInfo;
    loading: boolean;
    targetRegistry: string;
    targetChain: ChainTypes;
    targetStorage: string;
    message: {
        type: "negative" | "positive",
        header: string,
        message: string[]
    };
    registryOptions: { key: string, value: string, text: string }[];
    owner: string;
    currentAccount: string;
    newOwner: string;
    newOwnerLoading: boolean;
    newOwnerDone: boolean;
    editLocation: string;
    editLocationLoading: boolean;
    editLocationDone: boolean;
    deploymentStatus: DeploymentStatus;
    trustedUsers: { account: string }[];
    swarmGatewayUrl: string;
}

class Index extends React.Component<IIndexProps, IIndexState> {
    private bus = new Bus();
    private transferOwnershipModal;
    private addLocationModal;

    constructor(props) {
        super(props);

        this.state = {
            mi: null,
            vi: null,
            loading: true,
            targetRegistry: null,
            targetChain: null,
            targetStorage: 'swarm',
            message: null,
            registryOptions: [],
            owner: null,
            currentAccount: null,
            newOwner: '',
            newOwnerLoading: false,
            newOwnerDone: false,
            editLocation: '',
            editLocationLoading: false,
            editLocationDone: false,
            deploymentStatus: DeploymentStatus.Unknown,
            trustedUsers: [],
            swarmGatewayUrl: ''
        };

        this.bus.subscribe('data', async ({ mi, vi }) => {
            const { getSwarmGateway } = await initBGFunctions(browser);
            const swarmGatewayUrl = await getSwarmGateway();
            this.setState({ mi, vi, loading: false, swarmGatewayUrl });
            await this._updateData();
        });

        this.transferOwnershipModal = React.createRef();
        this.addLocationModal = React.createRef();
    }

    private async _updateData() {
        const { getRegistries, getTrustedUsers } = await initBGFunctions(browser);

        const registries = await getRegistries();
        const trustedUsers = await getTrustedUsers();
        const prodRegistries = registries.filter(r => !r.isDev && r.isEnabled);
        this.setState({
            registryOptions: prodRegistries.map(r => ({
                key: r.url, text: r.url, value: r.url
            })),
            targetRegistry: prodRegistries[0]?.url || null,
            trustedUsers,
            targetChain: chainByUri(typeOfUri(prodRegistries[0]?.url ?? ''))
        });

        return Promise.all([this._updateOwnership(), this._updateDeploymentStatus()]);
    }

    private async _updateOwnership() {
        const { getOwnership, getAddress } = await initBGFunctions(browser);
        const owner = await getOwnership(this.state.targetRegistry, this.state.mi.name);
        const currentAccount = await getAddress(DefaultSigners.EXTENSION, this.state.targetChain);

        this.setState({
            owner,
            currentAccount
        });
    }

    private async _updateDeploymentStatus() {
        this.setState({ deploymentStatus: DeploymentStatus.Unknown });
        const { getVersionInfo, getModuleInfoByName } = await initBGFunctions(browser);
        const mi = await getModuleInfoByName(this.state.targetRegistry, this.state.mi.name);
        const vi = await getVersionInfo(this.state.targetRegistry, this.state.mi.name, this.state.vi.branch, this.state.vi.version);
        const deploymentStatus = (!mi) ? DeploymentStatus.NewModule : (vi) ? DeploymentStatus.Deployed : DeploymentStatus.NotDeployed;
        this.setState({ deploymentStatus });
    }

    private async _transferOwnership(address: string) {
        this.setState({ newOwnerLoading: true });
        const { transferOwnership } = await initBGFunctions(browser);
        await transferOwnership(this.state.targetRegistry, this.state.mi.name, address);
        this.setState({ newOwnerLoading: false, newOwnerDone: true });
    }

    private async _addLocation(location: string) {
        this.setState({ editLocationLoading: true });
        const { addLocation } = await initBGFunctions(browser);
        await addLocation(this.state.targetRegistry, this.state.mi.name, location);
        this.setState({ editLocationLoading: false, editLocationDone: true });
    }

    private async _removeLocation(location: string) {
        this.setState({ editLocationLoading: true });
        const { removeLocation } = await initBGFunctions(browser);
        await removeLocation(this.state.targetRegistry, this.state.mi.name, location);
        this.setState({ editLocationLoading: false, editLocationDone: true });
    }

    async deployButtonClickHandler() {
        this.setState({ loading: true });

        const { deployModule, addTrustedUser } = await initBGFunctions(browser);
        const { mi, vi, targetRegistry, targetStorage, currentAccount } = this.state;

        try {
            const isNotNullCurrentAccount = !(!currentAccount || currentAccount === '0x0000000000000000000000000000000000000000');
            const isNotTrustedUser = isNotNullCurrentAccount && !this.state.trustedUsers.find(x => x.account.toLowerCase() === currentAccount.toLowerCase());
            if (isNotTrustedUser) {
                await addTrustedUser(currentAccount.toLowerCase());
            }

            const result = await deployModule(mi, vi, targetStorage, targetRegistry);
            this.setState({
                message: {
                    type: 'positive',
                    header: 'Module was deployed',
                    message: [
                        `Script URL: ${result.scriptUrl}`
                    ]
                },
                deploymentStatus: DeploymentStatus.Deployed
            });

        } catch (err) {
            this.setState({
                message: {
                    type: 'negative',
                    header: 'Publication error',
                    message: [err.message]
                }
            });
        } finally {
            this.setState({ loading: false });
        }
    }

    async pairWallet() {
        const { pairWalletViaOverlay } = await initBGFunctions(browser);
        await pairWalletViaOverlay(this.state.targetChain);
        await this._updateData();
    }

    render() {
        const {
            mi, vi, loading, targetRegistry,
            targetStorage, 
            message, registryOptions,
            owner, currentAccount, newOwner, editLocation: newLocation,
            newOwnerLoading, newOwnerDone, editLocationLoading: newLocationLoading,
            editLocationDone: newLocationDone
        } = this.state;

        const isNotNullCurrentAccount = !(!currentAccount || currentAccount === '0x0000000000000000000000000000000000000000');
        const isNotWalletPaired = !isNotNullCurrentAccount && !!owner;
        const isNotAnOwner = !!owner && isNotNullCurrentAccount && owner.toLowerCase() !== currentAccount.toLowerCase();
        const isAlreadyDeployed = !message && this.state.deploymentStatus === DeploymentStatus.Deployed;
        const isButtonDisabled = loading || this.state.deploymentStatus === DeploymentStatus.Deployed || !isNotNullCurrentAccount || isNotAnOwner;
        const isNewModule = this.state.deploymentStatus === DeploymentStatus.NewModule;
        const isNotTrustedUser = isNotNullCurrentAccount && !this.state.trustedUsers.find(x => x.account.toLowerCase() === currentAccount.toLowerCase());

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

                {(!isNotNullCurrentAccount) ? ((owner) ? (
                    <Message
                        warning
                        header='Wallet is not paired'
                        content={<React.Fragment>
                            You can not deploy a module without wallet pairing.<br />
                            Change account to {owner}<br/>
                            Connect a new wallet <Icon name='chain' link onClick={() => this.pairWallet()}/>
                        </React.Fragment>}
                    />
                ) : (
                    <Message
                        warning
                        header='Wallet is not paired'
                        content={<React.Fragment>
                            You can not deploy a module without wallet pairing.<br />
                            Connect a new wallet <Icon name='chain' link onClick={() => this.pairWallet()}/>
                        </React.Fragment>}
                    />
                )) : null}

                {(isNotAnOwner) ? (
                    <Message
                        error
                        header='Action Forbidden'
                        content={<React.Fragment>You can not deploy this module to the selected registry, because are not the module's owner.<br />Change account to {owner}</React.Fragment>}
                    />
                ) : null}

                {(isAlreadyDeployed) ? 
                    <Message
                        warning
                        header='The Module Already Deployed'
                        content={<React.Fragment>This version of the module has already been deployed to the selected registry. You can choose another registry or increment the module version number.</React.Fragment>}
                    />
                 : null}

                 {(isNewModule) ? 
                    <Message 
                        info
                        header='New Module'
                        content={<>
                            This module will be published for the first time in the selected registry.
                            {(this.state.mi.contextIds && this.state.mi.contextIds.length > 0) ? <>
                                <br/>
                                The following Context IDs will be added by default:
                                <List as='ul' style={{ marginTop: '4px' }}>
                                    {this.state.mi.contextIds.map((x, i) => <List.Item key={i} as='li'>{x}</List.Item>)}                                    
                                </List>
                            </> : null}
                        </>}
                    />
                 : null}

                {(isNotTrustedUser && this.state.deploymentStatus !== DeploymentStatus.Deployed) ? 
                    <Message 
                        info
                        header='Untrusted User'
                        content={<>
                            Your account is not on the list of trusted users.<br/>
                            It will be added automatically when the module is deployed.
                        </>}
                    /> 
                : null}

                {(mi) ? (<Card fluid>
                    <Card.Content>
                        <Image
                            floated='right'
                            size='mini'
                            circular
                            src={(mi.icon && mi.icon.uris.length > 0) ? ((mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1) ? joinUrls(this.state.swarmGatewayUrl, 'files/' + mi.icon.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]) : mi.icon.uris?.[0]) : NOLOGO_PNG}
                        />
                        <Card.Header>{mi.title}</Card.Header>
                        <Card.Meta>{mi.type}</Card.Meta>
                        <Card.Description>
                            {mi.description}<br />
                            {mi.author}<br />
                            <strong>{mi.name}#{vi.branch}@{vi.version}</strong><br />
                            {(owner) ? <>Owner: <a href='#' onClick={() => window.open(`https://rinkeby.etherscan.io/address/${owner}`, '_blank')}>{owner}</a></> : null}
                        </Card.Description>
                    </Card.Content>
                    {(owner && owner?.toLowerCase() === currentAccount?.toLowerCase()) ?
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
                                            this._updateData();
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


                <Form loading={loading}>

                    <Form.Input
                        required
                        label='Target Registry'
                        value={targetRegistry ?? ''}
                        readOnly
                    />

                    <Form.Select
                        required
                        label='Target Storage'
                        options={[
                            { key: 'swarm', text: 'Swarm', value: 'swarm' },
                            //{ key: 'test-registry', text: 'Test Registry', value: 'test-registry' }
                        ]}
                        placeholder='Target Storage'
                        value={targetStorage}
                        onChange={(e, data) => this.setState({
                            targetStorage: data.value as string
                        })}
                    />

                    <Button primary disabled={isButtonDisabled} onClick={() => this.deployButtonClickHandler()}>Deploy</Button>
                </Form>
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));