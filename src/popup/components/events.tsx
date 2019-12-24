import * as React from "react";
import * as extension from 'extensionizer';
import { initBGFunctions } from "chrome-extension-message-wrapper";

import { Event } from '../../common/models/event';

import { List, Segment } from "semantic-ui-react";

interface IEventsProps {

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
        const backgroundFunctions = await initBGFunctions(extension);
        const { getEvents } = backgroundFunctions;
        const events: Event[] = await getEvents();
        this.setState({ events });
    }

    render() {
        const { events } = this.state;
        return (
            <React.Fragment>
                <Segment loading={false} className="internalTab">
                    <List divided relaxed>
                        {events.map(e => (
                            <List.Item key={e.id}>
                                <List.Content>
                                    <List.Header>{e.title}</List.Header>
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
