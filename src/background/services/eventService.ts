import { Event } from "../../common/models/event";
import { generateGuid } from '../../common/utils';
import EventBrowserStorage from '../browserStorages/eventBrowserStorage';

export async function getEvents(): Promise<Event[]> {
    const eventBrowserStorage = new EventBrowserStorage();
    const events: Event[] = await eventBrowserStorage.getAll();
    return events;
}

export async function addEvent(title: string, description: string): Promise<void> {
    const eventBrowserStorage = new EventBrowserStorage();

    const event = new Event();
    event.id = generateGuid(); // ToDo: autoincrement?
    event.title = title;
    event.description = description;
    event.created = new Date();

    await eventBrowserStorage.create(event);
}