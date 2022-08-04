import anime from 'animejs'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { RefObject } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { ReactComponent as CopyShare } from '../../assets/icons/copyShare.svg'
import { ReactComponent as Share } from '../../assets/icons/share.svg'
import { SquaredButton } from '../SquaredButton'
interface Props {
  style?: React.CSSProperties
}

interface State {
  isShareUploading: boolean
  isShareCopied: boolean
  shareError: string
}

export class ShareButton extends React.Component<Props, State> {
  myRef: RefObject<HTMLDivElement>
  constructor(props: Props) {
    super(props)
    this.myRef = React.createRef()
    this.state = {
      isShareUploading: false,
      isShareCopied: false,
      shareError: null,
    }
  }
  componentDidUpdate() {
    anime({
      targets: this.myRef.current,
      scale: () => {
        if (this.state.isShareCopied === true) {
          return ['0.9', '1.1', '1']
        }
      },
      easing: 'easeInOutSine',
      loop: 2,
      duration: 800,
    })
    let timeline1 = anime.timeline()
    timeline1.add({
      targets: this.myRef.current,
      opacity: [1, 0],
      easing: 'linear',
      duration: 3000,
      delay: 1500,
    })
  }

  shareHandler = async () => {
    this.setState({ isShareUploading: true })

    try {
      const { createShareLink } = await initBGFunctions(browser)
      const url = await createShareLink(null)
      await navigator.clipboard.writeText(url)
      this.setState({ isShareUploading: false, isShareCopied: true })
      await new Promise((r) => setTimeout(r, 3000))
      this.setState({ isShareCopied: false })
      console.log(url)
    } catch (err) {
      this.setState({
        isShareUploading: false,
        shareError: err instanceof Error ? err.message : err,
      })
      await new Promise((r) => setTimeout(r, 3000))
      this.setState({ shareError: null })
    }
  }

  resetShareHandler = async () => {
    this.setState({
      shareError: null,
      isShareCopied: false,
      isShareUploading: false,
    })
  }

  render() {
    const s = this.state
    const p = this.props
    // console.log(s.isShareCopied, 's.isShareCopied ')
    // console.log(s.shareError, 's.shareError')
    // console.log(s.isShareUploading, 's.isShareUploading')

    // newAnime()
    return (
      <div style={p.style}>
        {/* ToDo: Uncomment it when loading and error icons will be ready */}
        {s.isShareCopied ? (
          <div ref={this.myRef}>
            <SquaredButton
              appearance="big"
              title="copy"
              icon={CopyShare}
              onClick={this.resetShareHandler}
            />
          </div>
        ) : s.shareError ? (
          <SquaredButton
            appearance="big"
            icon={Share}
            onClick={this.resetShareHandler}
            title={s.shareError}
          />
        ) : (
          <SquaredButton
            appearance="big"
            icon={Share}
            disabled={s.isShareUploading}
            onClick={this.shareHandler}
            title="Share the extension link with your configuration"
          />
        )}
        {/* <SquaredButton
          appearance="big"
          icon={Share}
          disabled={s.isShareUploading}
          onClick={this.shareHandler}
          title="Share the extension link with your configuration"
        /> */}
      </div>
    )
  }
}
