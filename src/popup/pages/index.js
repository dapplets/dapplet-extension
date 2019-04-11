import React, { Component } from 'react'
import InjectorList from '../components/InjectorList'
import Store from '../store'

class Index extends Component {

    render() {
        return (
            <React.Fragment>
                <div>{Store.currentUrl}</div>
                <InjectorList />
            </React.Fragment>
        )
    }
}

export default Index;