import { browser } from "webextension-polyfill-ts";
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
import * as logger from '../common/logger';

window.onerror = logger.log;

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
            devMode: false
        };

        this.bus.subscribe('data', async ({ mi, vi, schemaConfig, defaultConfig }) => {
            const { getDevMode } = await initBGFunctions(browser);
            const devMode = await getDevMode();
            
            if (!devMode) {
                if (schemaConfig && schemaConfig.properties) {
                    for (const key in schemaConfig.properties) {
                        if (schemaConfig.properties[key].hidden) {
                            delete schemaConfig.properties[key];
                        }
                    }
                }
            }

            this.setState({ mi, vi, schemaConfig, defaultConfig, devMode });
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
        await reloadFeature(this.state.mi.name, this.state.vi.version, this.state.mi.hostnames, this.state.mi.order, this.state.mi.sourceRegistry.url);
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
                        <Card fluid>
                            <Card.Content>
                                <Image
                                    floated='right'
                                    size='mini'
                                    circular
                                    src={(mi.icon && mi.icon.uris.length > 0) ? ((mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1) ? 'https://swarm.dapplets.org/files/' + mi.icon.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0] : mi.icon.uris?.[0]) : NOLOGO_PNG}
                                />
                                <Card.Header>{mi.title}</Card.Header>
                                <Card.Meta>{mi.type}</Card.Meta>
                                <Card.Description>
                                    {mi.description}<br />
                                    <strong>{mi.name}#{vi.branch}@{vi.version}</strong><br />
                                    {(owner) ? <React.Fragment>Owner: <a href='#' onClick={() => window.open(`https://rinkeby.etherscan.io/address/${owner}`, '_blank')}>{owner}</a></React.Fragment> : null}
                                </Card.Description>
                            </Card.Content>
                        </Card>
                        {(schemaConfig && schemaConfig.properties && Object.entries(schemaConfig.properties).map(([k, v]) => !v['hidden']).length > 0) ? <Form schema={schemaConfig || {}} onSubmit={e => this._saveData(e.formData)} formData={data}>
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