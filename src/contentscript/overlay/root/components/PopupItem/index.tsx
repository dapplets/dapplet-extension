import * as React from 'react'
import PopupLoader from '../../../../../overlay/assests/loader.svg'
import { Overlay } from '../../overlay'
import styles from './PopupItem.module.scss'

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
      <div data-testid="popup-item" ref={this.ref} className={styles['dapplets-popup-container']}>
        {s.isLoading && (
          <div className={styles['popup-loader-container']}>
            <div>
              <img src={PopupLoader} alt="Loading" />
            </div>
          </div>
        )}
      </div>
    )
  }
}
