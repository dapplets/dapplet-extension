import * as React from 'react';
import * as ReactDOM from 'react-dom';
//import 'semantic-ui-css/semantic.min.css';
import { getCurrentContextIds } from './helpers';
import Popup from './pages/popup';
import * as logger from '../common/logger';

window.onerror = logger.log;

ReactDOM.render(<Popup contextIds={getCurrentContextIds()} />, document.querySelector('#app'));