import BaseBrowserStorage from './baseBrowserStorage'
import { Event } from '../../common/models/event'

export default class EventBrowserStorage extends BaseBrowserStorage<Event> { 
    constructor() {
        super(Event, 'Event');
    }
}