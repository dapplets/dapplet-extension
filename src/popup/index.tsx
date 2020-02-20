import * as React from 'react';
import * as ReactDOM from 'react-dom';
//import 'semantic-ui-css/semantic.min.css';
import { getCurrentContextIds } from './helpers';

import Popup from './pages/popup';

(async function() {
    // ToDo: update contextIds
    console.log('contextids start');
    const contextIds = await getCurrentContextIds();
    console.log('contextids', contextIds);
    ReactDOM.render(<Popup contextIds={contextIds} />, document.querySelector('#app'));
})();