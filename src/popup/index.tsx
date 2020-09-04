import * as React from 'react';
import * as ReactDOM from 'react-dom';
//import 'semantic-ui-css/semantic.min.css';
import { getCurrentContextIds } from './helpers';
import Popup from './pages/popup';
import { logger } from '../common/logger';

window.onerror = logger;

(async function() {
    // ToDo: update contextIds
    const contextIds = await getCurrentContextIds();
    ReactDOM.render(<Popup contextIds={contextIds} />, document.querySelector('#app'));
})();