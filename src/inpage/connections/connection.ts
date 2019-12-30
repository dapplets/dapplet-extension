export interface ConnectionChaning {
    subscribe<T>(topic: string, h: EventTypes<T>): Subscription & T
    subscribe<T>(filter: MsgFilter, h: EventTypes<T>): Subscription & T
    subscribe<T>(h: EventTypes<T>): Subscription & T
    subscribe<T>(topicOrFilterOrTypeHandler: string | MsgFilter | EventTypes<T>, h?: EventTypes<T>): Subscription & T
    send(msg: any): Promise<void>
}

export abstract class Connection<ConnType> implements ConnectionChaning {
    constructor(public props:ConnType){}
    subConnections: Connection2<ConnType>[] = []
    subscriptions: Subscription[] = []
    
    subscribe<T>(topic: string, h: EventTypes<T>): Subscription & T
    subscribe<T>(filter: MsgFilter, h: EventTypes<T>): Subscription & T
    subscribe<T>(h: EventTypes<T>): Subscription & T
    subscribe<T>(topicOrFilterOrTypeHandler: string | MsgFilter | EventTypes<T>, handler?: EventTypes<T>): Subscription & T {
        let topic
        let filter
        if (typeof topicOrFilterOrTypeHandler === 'string') topic = topicOrFilterOrTypeHandler
        else if (typeof topicOrFilterOrTypeHandler === 'function') filter = topicOrFilterOrTypeHandler as MsgFilter
        else handler = topicOrFilterOrTypeHandler
        let sub = new Subscription(this, topic, filter, handler) 
        this.subscriptions.push(sub)
        return sub as Subscription & T
    }

    public abstract send(msg: any): Promise<void>;

    public close():void {
        for (const conn of this.subConnections) {
            conn.close()
        }
    }

    public spawn(moreProps:ConnType):Connection2<ConnType> {
        let props = {...this.props, ...moreProps}
        return new Connection2<ConnType>(moreProps)
    }

    public receive(m: any) { 
        for (let s of this.subscriptions) { 
            s.onMessage(m)
        }
    }

}