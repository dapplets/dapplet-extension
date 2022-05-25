import '../common/semantic-ui-css/semantic.min.css';
import './index.scss';
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Bus } from "../common/bus";
import * as tracing from "../common/tracing";
import { SettingsPage } from "./SettingsPage";

tracing.startTracing();

const bus = new Bus();

bus.subscribe("data", async ({ mi, vi, schemaConfig, defaultConfig }) => {
    ReactDOM.render(
        <SettingsPage
            mi={mi}
            vi={vi}
            schemaConfig={schemaConfig}
            defaultConfig={defaultConfig}
        />,
        document.querySelector("#app")
    );
});
