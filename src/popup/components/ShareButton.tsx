import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React from 'react'
import { Button } from 'semantic-ui-react'
import { browser } from 'webextension-polyfill-ts'

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
      const { createShareLink, getProfiles } = await initBGFunctions(browser)
      const profiles = await getProfiles()
      const currentProfileId = profiles.find((x) => x.isActive).id
      const url = await createShareLink(currentProfileId)
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

    const style = {
      margin: '0',
    }

    return (
      <div style={p.style}>
        {s.isShareCopied ? (
          <Button
            size="mini"
            icon="check"
            content="Copied"
            primary
            style={style}
            onClick={this.resetShareHandler}
          />
        ) : s.shareError ? (
          <Button
            size="mini"
            icon="exclamation triangle"
            color="red"
            content="Error"
            style={style}
            title={s.shareError}
            onClick={this.resetShareHandler}
          />
        ) : (
          <Button
            title="Share an extension link with your profile"
            size="mini"
            icon="share"
            content="Share"
            primary
            style={style}
            onClick={this.shareHandler}
            disabled={s.isShareUploading}
            loading={s.isShareUploading}
          />
        )}
      </div>
    )
  }
}
