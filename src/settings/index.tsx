import * as extension from 'extensionizer';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Card, Image, Button, Segment, Dimmer, Loader } from 'semantic-ui-react';
//import 'semantic-ui-css/semantic.min.css';
import './index.scss';
import { Bus } from '../common/bus';
import ModuleInfo from '../background/models/moduleInfo';
import { DefaultConfig, SchemaConfig } from '../common/types';
import VersionInfo from '../background/models/versionInfo';
import Form from "@rjsf/semantic-ui";
import NOLOGO_PNG from '../common/resources/no-logo.png';

interface IIndexProps { }

interface IIndexState {
    mi: ModuleInfo & { hostnames: string[], order: number, sourceRegistry: { url: string, isDev: boolean } };
    vi: VersionInfo;
    schemaConfig: SchemaConfig;
    defaultConfig: DefaultConfig;
    owner: string;
    data: any;
    loading: boolean;
}

class Index extends React.Component<IIndexProps, IIndexState> {
    private bus = new Bus();

    constructor(props) {
        super(props);

        this.state = {
            mi: null,
            vi: null,
            schemaConfig: null,
            defaultConfig: null,
            owner: null,
            data: {},
            loading: false
        };

        this.bus.subscribe('data', async ({ mi, vi, schemaConfig, defaultConfig }) => {
            this.setState({ mi, vi, schemaConfig, defaultConfig });
            await this._refreshData();
            await this._updateOwnership();
        });
    }

    private async _refreshData() {
        const { getAllUserSettings } = await initBGFunctions(extension);
        const defaultData = this.state.defaultConfig && this.state.defaultConfig[this.state.vi.environment] || {};
        const customData = await getAllUserSettings(this.state.mi.name);
        const data = { ...defaultData, ...customData };
        this.setState({ data });
    }

    private async _updateOwnership() {
        if (!this.state.mi.sourceRegistry.isDev) {
            const { getOwnership } = await initBGFunctions(extension);
            const owner = await getOwnership(this.state.mi.sourceRegistry.url, this.state.mi.name);
            this.setState({ owner });
        }
    }

    private async _saveData(data: any) {
        this.setState({ loading: true, data });
        const { setAllUserSettings } = await initBGFunctions(extension);
        await setAllUserSettings(this.state.mi.name, data);
        await this._refreshData();
        await this._reloadFeature();
        this.setState({ loading: false });
    }

    private async _reloadFeature() {
        const { reloadFeature } = await initBGFunctions(extension);
        await reloadFeature(this.state.mi.name, this.state.vi.version, this.state.mi.hostnames, this.state.mi.order, this.state.mi.sourceRegistry.url);
    }

    render() {
        const { mi, vi, schemaConfig, defaultConfig, owner, data } = this.state;

        return (
            <React.Fragment>
                <h1>User Settings</h1>

                {(mi && vi) ? (
                    <React.Fragment>
                        <Card fluid>
                            <Card.Content>
                                <Image
                                    floated='right'
                                    size='mini'
                                    circular
                                    src={(mi.icon && mi.icon.uris.length > 0) ? ((mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1) ? 'https://swarm-gateways.net/' + mi.icon.uris?.[0] : mi.icon.uris?.[0]) : NOLOGO_PNG}
                                />
                                <Card.Header>{mi.title}</Card.Header>
                                <Card.Meta>{mi.type}</Card.Meta>
                                <Card.Description>
                                    {mi.description}<br />
                                    <strong>{mi.name}#{vi.branch}@{vi.version}</strong><br />
                                    {(owner) ? { Owner: <a href='#' onClick={() => window.open(`https://rinkeby.etherscan.io/address/${owner}`, '_blank')}>{owner}</a> } : null}
                                </Card.Description>
                            </Card.Content>
                        </Card>
                        {schemaConfig ? <Form schema={schemaConfig || {}} onSubmit={e => this._saveData(e.formData)} formData={data}>
                            <div>
                                <Button type="submit" primary disabled={this.state.loading} loading={this.state.loading}>Save and Reload</Button>
                            </div>
                        </Form> : <p>No settings available for this dapplet.</p>}                        
                    </React.Fragment>
                ) : <Dimmer active inverted>
                        <Loader inverted>Loading</Loader>
                    </Dimmer>}
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));