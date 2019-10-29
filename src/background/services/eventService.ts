import { Event } from "../../common/models/event";
import { generateGuid } from '../../common/utils';
import EventBrowserStorage from '../browserStorages/eventBrowserStorage';

export async function getEvents(): Promise<Event[]> {
    //const eventBrowserStorage = new EventBrowserStorage();
    const events: Event[] = []; // await eventBrowserStorage.getAll();

    for (let i = 0; i < 100; i++) {
        const e = new Event();
        e.id = generateGuid();
        e.title = "Title of test event #" + (i + 1);
        e.description = "Here is description";
        e.created = new Date();
        events.push(e);
    }

    return events;
}