import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css'
import './index.scss';
import { Bus } from '../common/bus';
import styled from "styled-components";
import { Container, Header, Button } from 'semantic-ui-react'


interface IIndexProps {
}

interface IIndexState {
}

class Index extends React.Component<IIndexProps, IIndexState> {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        const {  } = this.state;

        return (
            <React.Fragment>
                Deployment will be here...
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));