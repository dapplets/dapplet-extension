import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Card, Image, Button, Dimmer, Loader, Message } from 'semantic-ui-react';
import '../common/semantic-ui-css/semantic.min.css';
import './index.scss';
import { Bus } from '../common/bus';
import ModuleInfo from '../background/models/moduleInfo';
import { DefaultConfig, SchemaConfig } from '../common/types';
import VersionInfo from '../background/models/versionInfo';
import Form from "@rjsf/semantic-ui";
import NOLOGO_PNG from '../common/resources/no-logo.png';
import * as tracing from '../common/tracing';
import { joinUrls } from "../common/helpers";
import { CONTEXT_ID_WILDCARD } from "../common/constants";

tracing.startTracing();

interface IIndexProps { }

interface IIndexState {
    mi: ModuleInfo & { hostnames: string[], order: number, sourceRegistry: { url: string, isDev: boolean } };
    vi: VersionInfo;
    schemaConfig: SchemaConfig;
    defaultConfig: DefaultConfig;
    owner: string;
    data: any;
    loading: boolean;
    devMode: boolean;
    hiddenProperties: string[];
    swarmGatewayUrl: string;
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
            loading: false,
            devMode: false,
            hiddenProperties: [],
            swarmGatewayUrl: ''
        };

        this.bus.subscribe('data', async ({ mi, vi, schemaConfig, defaultConfig }) => {
            const { getDevMode, getSwarmGateway } = await initBGFunctions(browser);
            const devMode = await getDevMode();
            const swarmGatewayUrl = await getSwarmGateway();
            
            const hiddenProperties = (schemaConfig && schemaConfig.properties) ? 
                Object.entries(schemaConfig.properties)
                    .filter(([k, v]: any) => v.hidden)
                    .map(([k, v]: any) => v.title ?? k) 
                : [];
            
            // Do not show hidden settings when developer mode is disabled
            if (!devMode) {
                if (schemaConfig && schemaConfig.properties) {
                    for (const key in schemaConfig.properties) {
                        if (schemaConfig.properties[key].hidden) {
                            delete schemaConfig.properties[key];
                        }
                    }
                }
            }

            this.setState({ mi, vi, schemaConfig, defaultConfig, devMode, hiddenProperties, swarmGatewayUrl });
            await this._refreshData();
            await this._updateOwnership();
        });
    }

    private async _refreshData() {
        const { getAllUserSettings } = await initBGFunctions(browser);
        const defaultData = this.state.defaultConfig && this.state.defaultConfig[this.state.vi.environment] || {};
        const customData = await getAllUserSettings(this.state.mi.name);
        const data = { ...defaultData, ...customData };
        this.setState({ data });
    }

    private async _updateOwnership() {
        if (!this.state.mi.sourceRegistry.isDev) {
            const { getOwnership } = await initBGFunctions(browser);
            const owner = await getOwnership(this.state.mi.sourceRegistry.url, this.state.mi.name);
            this.setState({ owner });
        }
    }

    private async _saveData(data: any) {
        this.setState({ loading: true, data });
        const { setAllUserSettings } = await initBGFunctions(browser);
        await setAllUserSettings(this.state.mi.name, data);
        await this._refreshData();
        await this._reloadFeature();
        this.setState({ loading: false });
    }

    private async _reloadFeature() {
        const { reloadFeature } = await initBGFunctions(browser);
        const isEverywhere = true;
        const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : this.state.mi.hostnames;
        await reloadFeature(this.state.mi.name, this.state.vi.version, targetContextIds, this.state.mi.order, this.state.mi.sourceRegistry.url);
    }

    private async _resetSettings() {
        this.setState({ loading: true });
        const { clearUserSettings } = await initBGFunctions(browser);
        await clearUserSettings(this.state.mi.name);
        await this._refreshData();
        await this._reloadFeature();
        this.setState({ loading: false });
    }

    render() {
        const { mi, vi, schemaConfig, defaultConfig, owner, data } = this.state;

        return (
            <React.Fragment>
                <h1>User Settings</h1>

                {(mi && vi) ? (
                    <React.Fragment>

                        {/* Warning about Hidden properties */}
                        {(this.state.devMode && this.state.hiddenProperties.length > 0) ?
                            <Message warning>
                                <Message.Header>Hidden settings</Message.Header>
                                <p>The following options are available only in developer mode:</p>
                                <p>{this.state.hiddenProperties.join(', ')}</p>
                            </Message> : null}

                        {/* Module Header Info */}
                        <Card fluid>
                            <Card.Content>
                                <Image
                                    floated='right'
                                    size='mini'
                                    circular
                                    src={(mi.icon && mi.icon.uris.length > 0) ? ((mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1) ? joinUrls(this.state.swarmGatewayUrl, 'bzz/' + mi.icon.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]) : mi.icon.uris?.[0]) : NOLOGO_PNG}
                                />
                                <Card.Header>{mi.title}</Card.Header>
                                <Card.Meta>{mi.type}</Card.Meta>
                                <Card.Description>
                                    {mi.description}<br />
                                    <strong>{mi.name}#{vi.branch}@{vi.version}</strong><br />
                                    {(owner) ? <React.Fragment>Owner: <a style={{ cursor: 'pointer' }} onClick={() => window.open(`https://goerli.etherscan.io/address/${owner}`, '_blank')}>{owner}</a></React.Fragment> : null}
                                </Card.Description>
                            </Card.Content>
                        </Card>

                        {/* Form */}
                        {(schemaConfig && schemaConfig.properties) ? <Form schema={schemaConfig || {}} onSubmit={e => this._saveData(e.formData)} formData={data}>
                            <div>
                                <Button type="submit" primary disabled={this.state.loading} loading={this.state.loading}>Save and Reload</Button>
                                <Button basic disabled={this.state.loading} onClick={() => this._resetSettings()}>Reset</Button>
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