import React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { StorageRef } from "../../background/registries/registry";
import NO_LOGO from "../../common/resources/no-logo.png";

interface Props {
  alt?: string;
  storageRef: StorageRef;
}

interface State {
  dataUri: string;
}

export class StorageRefImage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataUri: null,
    };
  }

  async componentDidMount() {
    try {
      const { getResource } = await initBGFunctions(browser);
      const base64 = await getResource(this.props.storageRef);
      const dataUri = "data:text/plain;base64," + base64;
      this.setState({ dataUri });
    } catch (_) {
      this.setState({ dataUri: NO_LOGO });
    }
  }

  render() {
    const p = this.props,
      s = this.state;

    if (!s.dataUri) {
      return <div style={{ width: "35px", height: "35px" }}></div>;
    }

    return (
      <img
        style={{ width: "35px", height: "35px" }}
        alt={p.alt}
        src={s.dataUri}
      />
    );
  }
}
