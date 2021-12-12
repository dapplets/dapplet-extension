import * as React from "react";
import { DappletConfirmation } from "./pages/dapplet-confirmation";
import { SystemOverlayTabs } from "../common/types";
import { LoginSession } from "./pages/login-session";
import { bus } from ".";

interface Props {
  activeTab: string;
  data: any;
}
interface State {}

export class App extends React.Component<Props, State> {
  render() {
    const { data } = this.props;

    switch (this.props.activeTab) {
      case SystemOverlayTabs.DAPPLET_CONFIRMATION:
        return <DappletConfirmation data={data} />;

      case SystemOverlayTabs.LOGIN_SESSION:
        return (
          <LoginSession
            bus={bus}
            data={data}
          />
        );

      default:
        return null;
    }
  }
}
