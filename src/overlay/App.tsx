import * as React from "react";
import { DappletConfirmation } from "./pages/dapplet-confirmation";
import { SystemOverlayTabs } from "../common/types";
import { LoginSession } from "./pages/login-session";
import { bus } from ".";
import { Overlay } from "./components/Overlay";

interface Props {
  activeTab: string;
  data: any;
  popup: boolean;
}

interface State {}

export class App extends React.Component<Props, State> {
  closeClickHandler = () => {
    bus.publish("cancel");
  };

  render() {
    const { data } = this.props;

    switch (this.props.activeTab) {
      case SystemOverlayTabs.DAPPLET_CONFIRMATION:
        return <DappletConfirmation data={data} />;

      case SystemOverlayTabs.LOGIN_SESSION:
        return this.props.popup ? (
          <Overlay
            onCloseClick={this.closeClickHandler}
            title={`Login to "${data.app}"`}
            subtitle={
              data.loginRequest.role ? `as "${data.loginRequest.role}"` : null
            }
          >
            <LoginSession bus={bus} data={data} />
          </Overlay>
        ) : (
          <Overlay
            title={`Login to "${data.app}"`}
            subtitle={
              data.loginRequest.role ? `as "${data.loginRequest.role}"` : null
            }
          >
            <LoginSession bus={bus} data={data} />
          </Overlay>
        );

      default:
        return null;
    }
  }
}
