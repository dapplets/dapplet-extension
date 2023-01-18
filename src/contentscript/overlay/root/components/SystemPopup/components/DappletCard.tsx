import * as React from 'react'
import ModuleInfo from '../../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../../background/models/versionInfo'
import { joinUrls } from '../../../../../../common/helpers'
import NOLOGO_PNG from '../../../../../../common/resources/no-logo.png'

export function DappletCard({
  vi,
  mi,
  swarmGatewayUrl,
}: {
  vi: VersionInfo
  mi: ModuleInfo
  swarmGatewayUrl: string
}) {
  return (
    // ToDo: rewrite legacy semantic ui code
    // <Card fluid>
    //   <Card.Content>
    //     <Image
    //       floated="right"
    //       size="mini"
    //       circular
    //       src={
    //         mi.icon && mi.icon.uris.length > 0
    //           ? mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1
    //             ? joinUrls(
    //                 swarmGatewayUrl,
    //                 'bzz/' + mi.icon.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]
    //               )
    //             : mi.icon.uris?.[0]
    //           : NOLOGO_PNG
    //       }
    //     />
    //     <Card.Header>{mi.title}</Card.Header>
    //     <Card.Meta>{mi.type}</Card.Meta>
    //     <Card.Description>
    //       {mi.description}
    //       <br />
    //       {mi.author}
    //       <br />
    //       <strong>
    //         {mi.name}#{vi.branch}@{vi.version}
    //       </strong>
    //     </Card.Description>
    //   </Card.Content>
    // </Card>
    <div>
      <div>
        <img
          src={
            mi.icon && mi.icon.uris.length > 0
              ? mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1
                ? joinUrls(
                    swarmGatewayUrl,
                    'bzz/' + mi.icon.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]
                  )
                : mi.icon.uris?.[0]
              : NOLOGO_PNG
          }
        />
        <div>{mi.title}</div>
        <div>{mi.type}</div>
        <div>
          {mi.description}
          <br />
          {mi.author}
          <br />
          <strong>
            {mi.name}#{vi.branch}@{vi.version}
          </strong>
        </div>
      </div>
    </div>
  )
}
