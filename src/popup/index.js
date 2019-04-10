import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import InjectorList from './components/InjectorList'

function App() {
  return (
    <InjectorList/>
  );
}

ReactDOM.render(<App />, document.querySelector('#app'));
