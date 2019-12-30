import { Connection } from './connection';

export type MessageHandler = (msg: any) => any // ToDo: Put into dapplet-extension-types?

export type MsgFilter = (msg: any) => boolean
export type EventTypes<T> = { [K in keyof T]: MsgFilter }

export interface ConnectionChaning<ConnType> {
    subscribe<T>(topic: string, h: EventTypes<T>): Subscription<ConnType> & T
    subscribe<T>(filter: MsgFilter, h: EventTypes<T>): Subscription<ConnType> & T
    subscribe<T>(h: EventTypes<T>): Subscription<ConnType> & T
    subscribe<T>(topicOrFilterOrTypeHandler: string | MsgFilter | EventTypes<T>, h?: EventTypes<T>): Subscription<ConnType> & T
    send(msg: any): Promise<void>
}

export interface DataSource {
    propertyName: string
    setter: (value: any) => void
}

export class Subscription<ConnType> implements ConnectionChaning<ConnType> {
    send = this.conn.send.bind(this.conn)
    subscribe = this.conn.subscribe.bind(this.conn)
    constructor(private conn: Connection<ConnType>, private topic: string = "", private filter?: MsgFilter, private onHandlerMap?: any) {
        if (onHandlerMap) {
            Object.keys(onHandlerMap).forEach((name: string) =>
                (<any>this)[name] = (msgHandler: MessageHandler) =>
                    this.on(onHandlerMap[name], msgHandler)
            )
        }
    }
    //public close(): void 
    public datasources: { [name: string]: DataSource } = {}
    public on_handlers: ((msg: any) => void)[] = []

    onMessage(msg: any): any {
        if (!msg || !this.matchesTopic(msg)
            || (this.filter && !this.filter(msg))) return
        //push values to DataSources
        Object.keys(this.datasources).forEach((key: string) => {
            let ds = this.datasources[key]
            msg[ds.propertyName] || ds.setter(msg[ds.propertyName])
        })

        this.on_handlers.forEach(fnOn => fnOn(msg))
    }


    on(condition: (msg: any) => boolean, handler: (msg: any) => void): Subscription<ConnType> {
        this.on_handlers.push(
            (msg: any) => ((condition(msg) && handler(msg)), this) as ConnectionChaning<ConnType>
        )
        return this
    }

    matchesTopic = (msg: any) => {
        if (!this.topic || this.topic == msg.topic) return true;
        else if (!msg.topic) return false;

        let expected = this.topic.split('.')
        let actual = msg.topic.split('.')
        if (expected.length > actual.length) return false

        for (let i = 0; i < actual.length; ++i) {
            if (actual[i] != expected[i] && expected[i] != "*")
                return false
        }
        return true
    }
}