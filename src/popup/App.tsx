import React from 'react'
import { InfoIcon } from './components/InfoIcon'

export const App: React.FC = () => {
  const page = new URLSearchParams(window.location.search).get('page')

  switch (page) {
    case 'unsupported-page':
      return (
        <>
          <header>
            <InfoIcon />
            Unsupported page
          </header>
          <div>You are on an unsupported page</div>
          <div>
            Dapplets Extension works on pages with context, for example on{' '}
            <a target="_blank" href="https://twitter.com/" rel="noreferrer">
              twitter.com
            </a>
          </div>
        </>
      )
    case 'no-cs-injected':
      return (
        <>
          <header>
            <InfoIcon />
            Reload page
          </header>
          <div>
            You have installed a new version of the Dapplets extension. To start working with it,
            you need to reload the page
          </div>
        </>
      )
    default:
      return null
  }
}
