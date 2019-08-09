import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import store from "../store";
import * as extension from 'extensionizer';

import { Button, Divider } from "semantic-ui-react";

interface IHeaderProps {

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
      hostname: store.currentHostname
    };
  }

  async componentDidMount() {
    var backgroundFunctions = await initBGFunctions(extension);
    const {
      getSuspendityByHostname,
      getSuspendityEverywhere
    } = backgroundFunctions;

    var isHostnameSuspended = await getSuspendityByHostname(
      store.currentHostname
    );
    var isEverywhereSuspended = await getSuspendityEverywhere();

    this.setState({
      isHostnameSuspended: isHostnameSuspended,
      isEverywhereSuspended: isEverywhereSuspended
    });
  }

  async resumeByHostnameButtonClick() {
    var backgroundFunctions = await initBGFunctions(extension);
    const { resumeByHostname } = backgroundFunctions;
    await resumeByHostname(store.currentHostname);

    this.setState({
      isHostnameSuspended: false
    });
  }

  async resumeEverywhereButtonClick() {
    var backgroundFunctions = await initBGFunctions(extension);
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
