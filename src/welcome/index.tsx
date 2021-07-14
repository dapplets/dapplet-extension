import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.scss';
import * as tracing from '../common/tracing';

tracing.startTracing();

interface IIndexProps { }
interface IIndexState { }

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