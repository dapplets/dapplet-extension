import { Event } from "../../common/types";
import { generateGuid } from '../../common/utils';

export async function getEvents(): Promise<Event[]> {
    const events: Event[] = [];

    for (let i = 0; i < 100; i++) {
        events.push({
            id: generateGuid(),
            title: "Title of test event #" + (i + 1),
            description: "Here is description",
            created: new Date()
        });
    }

    return events;
}