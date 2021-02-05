import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import NO_LOGO from '../../common/resources/no-logo.png';

import { Button, Checkbox, Divider, Icon, Image, Label, List, Popup } from "semantic-ui-react";
import ManifestDTO from "../../background/dto/manifestDTO";

export type ManifestAndDetails = ManifestDTO & { isLoading: boolean, isActionLoading: boolean, isHomeLoading: boolean, error: string, versions: string[] };

interface Props {
    feature: ManifestAndDetails;
    index: number;

    onSwitchChange: Function;
    onSettingsModule: Function;
    onOpenDappletAction: Function;
    onOpenDappletHome: Function;
    onToggleFeature: Function;
    onRemoveDapplet: Function;
}

interface State {
}

export class Dapplet extends React.Component<Props, State> {
    state = {

    };

    render() {
        const f = this.props.feature;
        const i = this.props.index;

        return <List.Item style={{ overflow: "hidden" }}>
            <List.Content style={{ width: 45, float: "left" }}>
                <Popup trigger={
                    <Image
                        size="mini"
                        avatar
                        alt={f.description}
                        src={
                            f.icon ? ((f.icon?.uris?.[0]?.indexOf('bzz:/') !== -1)
                                ? 'https://gateway.ethswarm.org/files/' + f.icon?.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]
                                : f.icon?.uris?.[0]) : null
                        }
                        onError={i => i.target.src = NO_LOGO}
                    />
                }>
                    <h4>Related Context IDs</h4>
                    <List>{f.hostnames?.map((h, j) => <List.Item key={j}>{h}</List.Item>)}</List>

                    <h4>Source registry</h4>
                    <List>{f.sourceRegistry?.url}</List>
                </Popup>
            </List.Content>
            <List.Content style={{ float: "right", width: 60 }}>
                <Checkbox
                    disabled={f.isLoading ?? false}
                    toggle
                    style={{ marginTop: 5 }}
                    onChange={(e) => (this.props.onSwitchChange(f, !f.isActive, i, e['shiftKey']))}
                    checked={f.isActive}
                />
            </List.Content>
            <List.Content style={{ marginLeft: 45, marginRight: 60 }} >
                <List.Header>
                    {f.title}
                    <Icon style={{ marginLeft: '4px', fontSize: '0.9em' }} link name='cog' size='small' onClick={() => this.props.onSettingsModule(f)} />
                    {(f.isActive && f.isActionHandler) ? <Icon style={{ fontSize: '0.9em' }} link name='home' size='small' onClick={() => this.props.onOpenDappletAction(f)} /> : null}
                    {(f.isActive && f.isHomeHandler) ? <Icon style={{ fontSize: '0.9em' }} link name='external' size='small' onClick={() => this.props.onOpenDappletHome(f)} /> : null}
                    {(f.sourceRegistry?.isDev) ? (<Label style={{}} horizontal size='mini' color='teal'>DEV</Label>) : null}
                    {(f.error) ? (<Popup size='mini' trigger={<Label style={{}} horizontal size='mini' color='red'>ERROR</Label>}>{f.error}</Popup>) : null}
                    {(f.isActive && f.activeVersion && f.lastVersion) ? (
                        (f.lastVersion === f.activeVersion) ? <Label style={{ cursor: 'default' }} horizontal size='mini' color='green' title='Up to date'>{f.activeVersion}</Label>
                            : <Label style={{ cursor: 'default' }} horizontal size='mini' color='orange' title={`New version is available: ${f.lastVersion}`}><Icon style={{ margin: '0 .25rem 0 0' }} name='arrow up' />{f.activeVersion}</Label>
                    ) : (((f.isActive && f.activeVersion) ? <Label style={{ cursor: 'default' }} horizontal size='mini' color='grey' >{f.activeVersion}</Label> : null))}
                    {(!f.available) ? <Label style={{ cursor: 'default' }} horizontal size='mini' color='grey' title='The dapplet is unavailable for this context'>UNAVAILABLE</Label> : null}
                    {(!f.available) ? <Icon style={{ fontSize: '0.9em' }} link name='close' size='small' title='Remove unavailable dapplet' onClick={() => this.props.onRemoveDapplet(f)} /> : null}
                </List.Header>
                <List.Description style={{ color: "#666" }}>
                    {f.description}
                    {(f.sourceRegistry?.isDev || !f.author) ? null : (<React.Fragment><br />Author: {f.author}</React.Fragment>)}
                    {(f.versions.length !== 0) ? <Label.Group style={{ marginTop: 3 }} size='mini'>{f.versions.map((v, k) => <Label as='a' key={k} onClick={() => this.props.onToggleFeature(f, v, true, i, f.versions)}>{v}</Label>)}</Label.Group> : null}<br />
                </List.Description>
            </List.Content>
        </List.Item>;
    }
}
