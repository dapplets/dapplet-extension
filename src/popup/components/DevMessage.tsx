import React, { Key } from "react";
import { Button, Message } from "semantic-ui-react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { SecureLink } from "react-secure-link";
import Linkify from "react-linkify";
import ReactTimeAgo from 'react-time-ago';

interface Props {}

interface State {
  devMessage: string;
  newExtensionVersion: string;
  discordMessages: {
    authorUsername: string,
    content: string,
    timestamp: string,
    link: string,
  }[];
}

export class DevMessage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      devMessage: null,
      newExtensionVersion: null,
      discordMessages: [],
    };
  }

  async componentDidMount() {
    const { getDevMessage, getNewExtensionVersion, getIgnoredUpdate, getDiscordMessages } = await initBGFunctions(browser);
    const devMessage = await getDevMessage();
    const ignoredUpdate = await getIgnoredUpdate();
    const newExtensionVersion = await getNewExtensionVersion();
    const discordMessages = await getDiscordMessages();

    this.setState({ 
      devMessage, 
      newExtensionVersion: (ignoredUpdate === newExtensionVersion) ? null : newExtensionVersion,
      discordMessages,
    });
  }

  async _hideDevMessage() {
    const { hideDevMessage } = await initBGFunctions(browser);
    await hideDevMessage(this.state.devMessage);
    this.setState({ devMessage: null });
  }

  async _hideDiscordMessages() {
    const { hideDiscordMessages } = await initBGFunctions(browser);
    await hideDiscordMessages(this.state.discordMessages[0].timestamp);
    this.setState({ discordMessages: [] });
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

    if (s.discordMessages.length) {
      const { authorUsername, content, timestamp, link } = s.discordMessages[0];

      const otherUnreadMsgsNumber = s.discordMessages.length - 1;
      let linkMessage: string;
      if (otherUnreadMsgsNumber === 0) {
        linkMessage = 'no more unread messages';
      } else if (otherUnreadMsgsNumber === 1) {
        linkMessage = '1 more unread message';
      } else if (otherUnreadMsgsNumber >= 2 && otherUnreadMsgsNumber <= 10) {
        linkMessage = `${otherUnreadMsgsNumber} more unread messages`;
      } else {
        linkMessage = 'more than 10 unread messages';
      }
      return (
        <Message info onDismiss={() => this._hideDiscordMessages()} style={{ paddingBottom: '5px' }}>
          <Message.Header>
            <a href={link} target="_blank" style={{ color: '#276f86' }}>
              Dapplets announcements
            </a>
          </Message.Header>
          <Message.Content style={{ marginTop: '10px' }}>
            <p style={{ marginBottom: '0', fontSize: '13px' }}>
              <b>{authorUsername}</b>
              <span style={{ fontSize: '12px', opacity: '.7', letterSpacing: '0.3px', paddingLeft: '5px' }}>
                <ReactTimeAgo date={new Date(timestamp)} locale="en-US" />
              </span>
            </p>
            <p style={{ margin: '0 auto' }}>
              <Linkify componentDecorator={( decoratedHref: string, decoratedText: string, key: Key) => (
                <SecureLink href={decoratedHref} key={key}>{decoratedText}</SecureLink>
              )}>
                {content}
              </Linkify>
            </p>
            <div style={{ fontSize: '13px', marginTop: '10px' }}>
              <a href={link} target="_blank">
                {linkMessage}
              </a>
            </div>
          </Message.Content>
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
