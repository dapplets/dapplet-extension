import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { Button, List, Segment, Icon, Input, Message } from "semantic-ui-react";
import ManifestDTO from "../../background/dto/manifestDTO";
import { ModuleTypes } from "../../common/constants";
import { getCurrentContextIds, getCurrentTab } from "../helpers";
import { rcompare } from "semver";
import { Dapplet, ManifestAndDetails } from "../components/dapplet";
import Manifest from "../../background/models/manifest";
import { DevMessage } from "../components/DevMessage";

interface IDappletsProps {
  contextIds: Promise<string[] | undefined>;
  isOverlay: boolean;
}

interface IDappletsState {
  features: ManifestAndDetails[];
  isLoading: boolean;
  error: string;
  isNoInpage: boolean;
  search: string;
  swarmGatewayUrl: string;
  devMessage: string;
}

class Dapplets extends React.Component<IDappletsProps, IDappletsState> {
  private _isMounted: boolean = false;

  state = {
    features: [],
    isLoading: true,
    error: null,
    isNoInpage: false,
    search: '',
    swarmGatewayUrl: '',
    devMessage: null
  }

  async componentDidMount() {
    this._isMounted = true;
    const { contextIds } = this.props;
    await this._refreshDataByContext(contextIds);
  }

  async _refreshDataByContext(contextIds: Promise<string[]>) {
    let contextIdsValues = undefined;

    try {
      contextIdsValues = await contextIds;
    } catch (err) {
      console.error(err);
      this.setState({ isNoInpage: true, isLoading: false });
      return;
    }

    const { getFeaturesByHostnames, getRegistries, getSwarmGateway } = await initBGFunctions(browser);

    const swarmGatewayUrl = await getSwarmGateway();

    const registries = await getRegistries();
    const regsWithErrors = registries.filter(r => !!r.error).length;
    if (regsWithErrors > 0) {
      this.setState({
        error: `There are registries with connection problems. Please check the settings.`
      });
    }

    const features: ManifestDTO[] = await getFeaturesByHostnames(contextIdsValues);

    if (this._isMounted) {
      this.setState({
        features: features.filter(f => f.type === ModuleTypes.Feature).map(f => ({ ...f, isLoading: false, isActionLoading: false, isHomeLoading: false, error: null, versions: [] })),
        isLoading: false,
        swarmGatewayUrl
      });
    }
  }

  async handleSwitchChange(module: (ManifestDTO & { isLoading: boolean, error: string, versions: string[] }), isActive, order, selectVersions: boolean) {
    const { name, hostnames, sourceRegistry } = module;
    const { getVersions } = await initBGFunctions(browser);

    const allVersions = await getVersions(module.sourceRegistry.url, module.name);

    if (selectVersions && isActive) {
      this._updateFeatureState(name, { versions: allVersions });
      return;
    } else {
      const lastVersion = allVersions.sort(rcompare)[0];
      await this.toggleFeature(module, lastVersion, isActive, order, allVersions);
    }

  }

  async toggleFeature(module: (ManifestDTO & { isLoading: boolean, error: string, versions: string[] }), version: string, isActive: boolean, order: number, allVersions: string[]) {
    const { name, hostnames, sourceRegistry } = module;
    const { activateFeature, deactivateFeature } = await initBGFunctions(browser);

    this._updateFeatureState(name, { isActive, isLoading: true, error: null, versions: [], activeVersion: (isActive) ? version : null, lastVersion: allVersions.sort(rcompare)[0] });

    try {
      if (isActive) {
        await activateFeature(name, version, hostnames, order, sourceRegistry.url);
      } else {
        await deactivateFeature(name, version, hostnames, order, sourceRegistry.url);
      }

      await this._refreshDataByContext(this.props.contextIds);

    } catch (err) {
      this._updateFeatureState(name, { isActive: !isActive, error: err.message });
    }

    this._updateFeatureState(name, { isLoading: false });
  }

  private _updateFeatureState(name: string, f: any) {
    this.setState(state => {
      const features = state.features.map(feature => {
        if (feature.name == name) {
          Object.entries(f).forEach(([k, v]) => feature[k] = v);
        }
        return feature;
      });

      return { features };
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async refreshContextPage() {
    const tab = await getCurrentTab();
    if (!tab) return;
    await browser.tabs.update(tab.id, { url: tab.url });
    this.setState({ isNoInpage: false, isLoading: true });
    setTimeout(() => this._refreshDataByContext(getCurrentContextIds()), 4000); // ToDo: get rid of timeout
  }

  async settingsModule(mi: ManifestDTO) {
    const { openSettingsOverlay } = await initBGFunctions(browser);
    await openSettingsOverlay(mi);
    window.close();
  }

  openDappletAction = async (f: ManifestAndDetails) => {
    try {
      this._updateFeatureState(f.name, { isActionLoading: true });
      const { openDappletAction } = await initBGFunctions(browser);
      const tab = await getCurrentTab();
      if (!tab) return;
      await openDappletAction(f.name, tab.id);
      window.close();
    } catch (err) {
      console.error(err);
    } finally {
      this._updateFeatureState(f.name, { isActionLoading: false });
    }
  }

  openDappletHome = async (f: ManifestAndDetails) => {
    try {
      this._updateFeatureState(f.name, { isHomeLoading: true });
      const { openDappletHome } = await initBGFunctions(browser);
      const tab = await getCurrentTab();
      if (!tab) return;
      await openDappletHome(f.name, tab.id);
      window.close();
    } catch (err) {
      console.error(err);
    } finally {
      this._updateFeatureState(f.name, { isHomeLoading: false });
    }
  }

  removeDapplet = async (f: Manifest) => {
    const { removeDapplet } = await initBGFunctions(browser);
    const contextIds = await this.props.contextIds;
    await removeDapplet(f.name, contextIds);
    this.setState({
      features: this.state.features.filter(x => x.name !== f.name)
    });
  }

  _searchChangeHandler(value: string) {
    this.setState({ search: value });
  }

  _getFilteredDapplets() {
    const { features, search } = this.state;
    if (!search || search.length === 0) return features;

    const find = (a: string) => (a ?? '').toLowerCase().indexOf(search.toLowerCase()) !== -1;
    return features.filter((x: ManifestAndDetails) => find(x.name) || find(x.title) || find(x.description) || find(x.author));
  }

  render() {
    const { isLoading, error, isNoInpage, search, devMessage } = this.state;
    const features = this._getFilteredDapplets();

    return (
      <React.Fragment>
        <DevMessage isOverlay={this.props.isOverlay} />

        {(!isLoading) ? <Input
          fluid
          iconPosition='left'
          icon
          placeholder='Search...'
        >
          <Icon name='search' />
          <input value={search} onChange={e => this._searchChangeHandler(e.target.value)} />
          {(search.length > 0) ? <Icon 
            name='close' 
            link 
            style={{ right: '1px', left: 'initial' }} 
            onClick={() => this._searchChangeHandler('')}
          /> : null}
        </Input> : null}

        <Segment loading={isLoading} className={(this.props.isOverlay) ? undefined : "internalTabDapplets"} style={{ marginTop: '10px'}} >
          {!isNoInpage ?
            (features.length > 0) ? (
              <List divided relaxed>
                {features.map((f, i) => (
                  <Dapplet
                    key={i}
                    index={i}
                    feature={f}
                    onSwitchChange={this.handleSwitchChange.bind(this)}
                    onSettingsModule={this.settingsModule.bind(this)}
                    onOpenDappletAction={this.openDappletAction.bind(this)}
                    onOpenDappletHome={this.openDappletHome.bind(this)}
                    onToggleFeature={this.toggleFeature.bind(this)}
                    onRemoveDapplet={this.removeDapplet.bind(this)}
                    swarmGatewayUrl={this.state.swarmGatewayUrl}
                  />
                ))}
              </List>
            ) : (<div>No available features for current site.</div>)
            : (<div>
              No connection with context webpage.
              <br />
              Please refresh it.
              <br />
              <Button
                compact
                size='tiny'
                color='blue'
                content='Refresh'
                onClick={() => this.refreshContextPage()}
                style={{ marginTop: '6px' }}
              />
            </div>)}
        </Segment>
      </React.Fragment>
    );
  }
}

export default Dapplets;
