import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { List, Segment, Label } from "semantic-ui-react";

import { Event } from '../../common/models/event';

interface IEventsProps {
    isOverlay: boolean;
}

interface IEventsState {
    events: Event[];
}

class Events extends React.Component<IEventsProps, IEventsState> {
    constructor(props) {
        super(props);

        this.state = {
            events: []
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(browser);
        const { getEvents, setRead } = backgroundFunctions;
        const events: Event[] = await getEvents();
        this.setState({ events });
        setRead(events.map(e => e.id));
    }

    render() {
        const { events } = this.state;
        return (
            <React.Fragment>
                <Segment loading={false} className={(this.props.isOverlay) ? undefined : "internalTab"} style={{ marginTop: (this.props.isOverlay) ? 0 : undefined }}>
                    <List divided relaxed>
                        {events.map(e => (
                            <List.Item key={e.id}>
                                <List.Content>
                                    <List.Header>{e.isRead === false ? (<Label circular color='blue' empty />) : null} {e.title}</List.Header>
                                    <List.Description>{e.description}</List.Description>
                                </List.Content>
                            </List.Item>
                        ))}

                        {!events.length && <div>No notifications.</div>}
                    </List>
                </Segment>
            </React.Fragment>
        );
    }
}

export default Events;
