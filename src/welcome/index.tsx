import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Form, Message, Image, Card, Modal, Input, Icon, List } from 'semantic-ui-react';
//import 'semantic-ui-css/semantic.min.css';
import NOLOGO_PNG from '../common/resources/no-logo.png';

import './index.scss';
import { Bus } from '../common/bus';
import ModuleInfo from '../background/models/moduleInfo';
import VersionInfo from '../background/models/versionInfo';
import * as tracing from '../common/tracing';
import { ChainTypes, DefaultSigners } from "../common/types";
import { typeOfUri, chainByUri } from "../common/helpers";

tracing.startTracing();

interface IIndexProps { }

interface IIndexState {
    
}

class Index extends React.Component<IIndexProps, IIndexState> {

    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        return <div>
            Welcome Page
        </div>;
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));