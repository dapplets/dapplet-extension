import React from 'react'
import { Label, LabelProps } from 'semantic-ui-react'
import { SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic'

interface Props extends LabelProps {
  hoverColor: SemanticCOLORS
  hoverText: string
}

interface State {
  isHover: boolean
}

export class HoverLabel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isHover: false,
    }
  }

  mouseOverHandler = () => {
    this.setState({ isHover: true })
  }

  mouseOutHandler = () => {
    this.setState({ isHover: false })
  }

  render() {
    const p = this.props
    const s = this.state
    const color = s.isHover ? p.hoverColor ?? p.color : p.color
    const text = s.isHover ? p.hoverText ?? p.children : p.children

    return (
      <Label
        //{...p}
        onMouseOver={this.mouseOverHandler}
        onMouseOut={this.mouseOutHandler}
        horizontal={p.horizontal}
        color={color}
        floated={p.floated}
        size={p.size}
        loading={p.loading}
        disabled={p.disabled}
        onClick={(e, d) => (this.mouseOutHandler(), p.onClick?.(e, d))}
        index={p.index}
        style={p.style}
      >
        {text}
      </Label>
    )
  }
}
