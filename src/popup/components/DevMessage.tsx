import React, { Key } from "react";
import { Message } from "semantic-ui-react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { SecureLink } from "react-secure-link";
import Linkify from "react-linkify";

interface Props {}

interface State {
  devMessage: string;
}

export class DevMessage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      devMessage: null,
    };
  }

  async componentDidMount() {
    const { getDevMessage } = await initBGFunctions(browser);
    const devMessage = await getDevMessage();
    this.setState({ devMessage });
  }

  async _hideDevMessage() {
    const { hideDevMessage } = await initBGFunctions(browser);
    await hideDevMessage(this.state.devMessage);
    this.setState({ devMessage: null });
  }

  render() {
    const s = this.state;

    if (!s.devMessage) return null;

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
}
