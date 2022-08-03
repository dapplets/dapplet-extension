import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React from 'react'
import { browser } from 'webextension-polyfill-ts'
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
  constructor(props: Props) {
    super(props)
    this.state = {
      isShareUploading: false,
      isShareCopied: false,
      shareError: null,
    }
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

    return (
      <div style={p.style}>
        {/* ToDo: Uncomment it when loading and error icons will be ready */}
        {/* {s.isShareCopied ? (
          <SquaredButton appearance="big" icon={Share} onClick={this.resetShareHandler} />
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
        )} */}
        <SquaredButton
          appearance="big"
          icon={Share}
          disabled={s.isShareUploading}
          onClick={this.shareHandler}
          title="Share the extension link with your configuration"
        />
      </div>
    )
  }
}
