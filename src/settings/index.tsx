import * as extension from 'extensionizer';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Form, Message, Image, Card, Modal, Input } from 'semantic-ui-react';
//import 'semantic-ui-css/semantic.min.css';
import './index.scss';
import { Bus } from '../common/bus';
import ModuleInfo from '../background/models/moduleInfo';

interface IIndexProps { }

interface IIndexState {
    mi: ModuleInfo;
}

class Index extends React.Component<IIndexProps, IIndexState> {
    private bus = new Bus();

    constructor(props) {
        super(props);

        this.state = {
            mi: null
        };

        this.bus.subscribe('data', ({ mi }) => this.setState({ mi }));
    }

    render() {
        const { mi } = this.state;

        return (
            <React.Fragment>
                <h1>User Settings</h1>
                <p>{JSON.stringify(mi)}</p>
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));