import * as React from "react";
import { joinUrls } from "../../common/helpers";
import VersionInfo from "../../background/models/versionInfo";
import ModuleInfo from "../../background/models/moduleInfo";
import { Card, Image } from "semantic-ui-react";
import NOLOGO_PNG from '../../common/resources/no-logo.png';

export function DappletCard({vi, mi, swarmGatewayUrl}: { vi: VersionInfo, mi: ModuleInfo, swarmGatewayUrl: string }) {
    return <Card fluid>
        <Card.Content>
            <Image
                floated='right'
                size='mini'
                circular
                src={(mi.icon && mi.icon.uris.length > 0) ? ((mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1) ? joinUrls(swarmGatewayUrl, 'bzz/' + mi.icon.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]) : mi.icon.uris?.[0]) : NOLOGO_PNG}
            />
            <Card.Header>{mi.title}</Card.Header>
            <Card.Meta>{mi.type}</Card.Meta>
            <Card.Description>
                {mi.description}<br />
                {mi.author}<br />
                <strong>{mi.name}#{vi.branch}@{vi.version}</strong>
            </Card.Description>
        </Card.Content>
    </Card>
}