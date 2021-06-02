import React, { Key } from "react";
import { Button, Icon, Message } from "semantic-ui-react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { SecureLink } from "react-secure-link";
import Linkify from "react-linkify";

interface Props {}

interface State {
  devMessage: string;
  newExtensionVersion: string;
}

export class DevMessage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      devMessage: null,
      newExtensionVersion: null
    };
  }

  async componentDidMount() {
    const { getDevMessage, getNewExtensionVersion, getIgnoredUpdate } = await initBGFunctions(browser);
    const devMessage = await getDevMessage();
    const ignoredUpdate = await getIgnoredUpdate();
    const newExtensionVersion = await getNewExtensionVersion();
    
    this.setState({ 
      devMessage, 
      newExtensionVersion: (ignoredUpdate === newExtensionVersion) ? null : newExtensionVersion
    });
  }

  async _hideDevMessage() {
    const { hideDevMessage } = await initBGFunctions(browser);
    await hideDevMessage(this.state.devMessage);
    this.setState({ devMessage: null });
  }

  async _ignoreUpdate() {
    const { setIgnoredUpdate } = await initBGFunctions(browser);
    setIgnoredUpdate(this.state.newExtensionVersion);
    this.setState({ newExtensionVersion: null });
  }

  _downloadUpdate() {
    const url = 'https://github.com/dapplets/dapplet-extension/releases/latest/download/dapplet-extension.zip';
    window.open(url, '_blank');
  }

  render() {
    const s = this.state;

    if (s.newExtensionVersion) {
      return (
        <Message info size="small">
          <div style={{ display: 'flex' }}>
          <Message.Content style={{ flex: 'auto'}}>
            <Message.Header>Update extension</Message.Header>
            <p>Newer version is available: <a href="https://github.com/dapplets/dapplet-extension/releases/latest" target="_blank"><b>{s.newExtensionVersion}</b></a></p>
          </Message.Content>
            <Button.Group size="mini" style={{ display: 'unset', margin: 'auto 0'} }>
              <Button primary onClick={this._downloadUpdate.bind(this)}>Update</Button>
              <Button onClick={this._ignoreUpdate.bind(this)}>Ignore</Button>
            </Button.Group>
          </div>
        </Message>
      );
    }

    if (s.devMessage) {
      const [title, ...messages] = s.devMessage.split('\n');

      return (
        <Message info onDismiss={() => this._hideDevMessage()}>
          <Message.Header>{title}</Message.Header>
          <p>
            <Linkify
              componentDecorator={( decoratedHref: string, decoratedText: string, key: Key) => (
                <SecureLink href={decoratedHref} key={key}>{decoratedText}</SecureLink>
              )}
            >
              {messages.map((x) => (<>{x}<br /></>))}
            </Linkify>
          </p>
        </Message>
      );
    }

    return null;
  }
}
