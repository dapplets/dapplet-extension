import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { Button, Divider } from "semantic-ui-react";

interface IHeaderProps {
  contextIds: Promise<string[]>;
}

interface IHeaderState {
  isHostnameSuspended: boolean;
  isEverywhereSuspended: boolean;
  hostname?: string;
}

class Header extends React.Component<IHeaderProps, IHeaderState> {
  constructor(props) {
    super(props);

    this.state = {
      isHostnameSuspended: false,
      isEverywhereSuspended: false,
      hostname: null
    };
  }

  async componentDidMount() {
    try {
      const contextId = await this.props.contextIds;
      const { getSuspendityByHostname, getSuspendityEverywhere } = await initBGFunctions(browser);
      const isHostnameSuspended = await getSuspendityByHostname(contextId);
      const isEverywhereSuspended = await getSuspendityEverywhere();

      this.setState({
        isHostnameSuspended: isHostnameSuspended,
        isEverywhereSuspended: isEverywhereSuspended
      });
    } catch (err) {
      console.error(err);
    }
  }

  async resumeByHostnameButtonClick() {
    const backgroundFunctions = await initBGFunctions(browser);
    const { resumeByHostname } = backgroundFunctions;
    await resumeByHostname(this.props.contextIds[0]);

    this.setState({
      isHostnameSuspended: false
    });
  }

  async resumeEverywhereButtonClick() {
    const backgroundFunctions = await initBGFunctions(browser);
    const { resumeEverywhere } = backgroundFunctions;
    await resumeEverywhere();

    this.setState({
      isEverywhereSuspended: false
    });
  }

  render() {
    const { isHostnameSuspended, isEverywhereSuspended } = this.state;

    return (
      <React.Fragment>
        {isHostnameSuspended && (
          <div style={{ overflow: "hidden" }}>
            ⚠️ Injectors are suspended at this site.
            <Button
              size="mini"
              positive
              onClick={() => this.resumeByHostnameButtonClick()}
              style={{ padding: 5, width: 55, float: "right" }}
            >
              Resume
            </Button>
          </div>
        )}
        {isEverywhereSuspended && (
          <div style={{ overflow: "hidden", marginTop: 4 }}>
            ⚠️ Injectors are suspended everywhere.
            <Button
              size="mini"
              positive
              onClick={() => this.resumeEverywhereButtonClick()}
              style={{ padding: 5, width: 55, float: "right" }}
            >
              Resume
            </Button>
          </div>
        )}
        {(isHostnameSuspended || isEverywhereSuspended) && <Divider />}
      </React.Fragment>
    );
  }
}

export default Header;
