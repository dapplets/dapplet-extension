import React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import store from "../store";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";

class Header extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isHostnameSuspended: false,
      isEverywhereSuspended: false,
      hostname: store.currentHostname
    };
  }

  async componentDidMount() {
    var backgroundFunctions = await initBGFunctions(chrome);
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

  async resumeByHostname() {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { resumeByHostname } = backgroundFunctions;
    await resumeByHostname(store.currentHostname);

    this.setState({
      isHostnameSuspended: false
    });
  }

  async resumeEverywhere() {
    var backgroundFunctions = await initBGFunctions(chrome);
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
          <div>
            ⚠️ Injectors are suspended at this site.
            <Button
              size="small"
              color="primary"
              variant="contained"
              onClick={() => this.resumeByHostname()}
            >
              Resume {this.state.hostname}
            </Button>
          </div>
        )}
        {isEverywhereSuspended && (
          <div>⚠️ Injectors are suspended everywhere.</div>
        )}
        <Divider light />
      </React.Fragment>
    );
  }
}

export default Header;
