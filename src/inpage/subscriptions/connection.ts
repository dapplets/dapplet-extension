import { ConnectionChaning, Subscription, EventTypes, MsgFilter } from './subscription';

export abstract class Connection<ConnType> implements ConnectionChaning<ConnType> {
    constructor(public props: ConnType) { }
    subConnections: Connection<ConnType>[] = []
    subscriptions: Subscription<ConnType>[] = []

    subscribe<T>(topic: string, h: EventTypes<T>): Subscription<ConnType> & T
    subscribe<T>(filter: MsgFilter, h: EventTypes<T>): Subscription<ConnType> & T
    subscribe<T>(h: EventTypes<T>): Subscription<ConnType> & T
    subscribe<T>(topicOrFilterOrTypeHandler: string | MsgFilter | EventTypes<T>, handler?: EventTypes<T>): Subscription<ConnType> & T {
        let topic
        let filter
        if (typeof topicOrFilterOrTypeHandler === 'string') topic = topicOrFilterOrTypeHandler
        else if (typeof topicOrFilterOrTypeHandler === 'function') filter = topicOrFilterOrTypeHandler as MsgFilter
        else handler = topicOrFilterOrTypeHandler
        let sub = new Subscription(this, topic, filter, handler)
        this.subscriptions.push(sub)
        return sub as Subscription<ConnType> & T
    }

    public abstract send(msg: any): Promise<void>;

    public close(): void {
        for (const conn of this.subConnections) {
            conn.close()
        }
    }

    // todo: cannot create an instance of an abstract class
    // public spawn(moreProps: ConnType): Connection<ConnType> {
    //     let props = { ...this.props, ...moreProps }
    //     return new Connection<ConnType>(moreProps)
    // }

    public receive(m: any) {
        for (let s of this.subscriptions) {
            s.onMessage(m)
        }
    }

}