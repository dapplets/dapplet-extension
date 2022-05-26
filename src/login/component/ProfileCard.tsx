import React from 'react'
import { Card, Image } from 'semantic-ui-react'
// import Twemoji from 'react-twemoji';

interface IProps {
  account: {
    username: string
    fullname: string
    img: string
    domainId: number
  }
  style?: any
}

interface IState {}

export class ProfileCard extends React.Component<IProps, IState> {
  render() {
    const p = this.props.account
    return (
      <Card fluid style={this.props.style}>
        <Card.Content>
          <Image
            floated="left"
            size="mini"
            style={{ borderRadius: 34, marginBottom: 0 }}
            src={p.img}
          />
          <Card.Header style={{ fontSize: '1.2em' }}>
            {/* <Twemoji>{p.fullname}</Twemoji> */}
            {p.fullname}
          </Card.Header>
          <Card.Meta>@{p.username}</Card.Meta>
        </Card.Content>
      </Card>
    )
  }
}
