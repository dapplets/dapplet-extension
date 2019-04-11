import React, { Component } from 'react'
import InjectorList from '../components/InjectorList'
import Header from '../components/Header'
import Store from '../store'

class Index extends Component {

    render() {
        return (
            <React.Fragment>
                <Header />
                <InjectorList />
            </React.Fragment>
        )
    }
}

export default Index;