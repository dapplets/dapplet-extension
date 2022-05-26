import * as React from 'react'
import PopupLoader from '../../../overlay/assests/loader.svg'
import { Overlay } from './overlay'

interface P {
  overlay: Overlay
}

interface S {
  isLoading: boolean
}

export class PopupItem extends React.Component<P, S> {
  ref = React.createRef<HTMLDivElement>()

  constructor(props: P) {
    super(props)

    this.state = {
      isLoading: true,
    }
  }

  componentDidMount() {
    this.ref.current.appendChild(this.props.overlay.frame)
    this.props.overlay.frame.addEventListener('load', () => {
      this.setState({ isLoading: false })
    })
  }

  render() {
    const s = this.state

    return (
      <div ref={this.ref} className="dapplets-popup-container">
        {s.isLoading && (
          <div className="popup-loader-container">
            <div>
              <img src={PopupLoader} alt="Loading" />
            </div>
          </div>
        )}
      </div>
    )
  }
}
