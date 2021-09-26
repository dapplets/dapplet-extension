export function publish(name:string, data:any) {
    let e:any = new Event(name)
    e.data = data
    dispatchEvent(e)
}

export function subscribe(name: string, handler: (e:Event)=>void) {
    addEventListener(name, handler)
}

export function unsubscribe(name: string, handler: (e:Event)=>void) {
    removeEventListener(name, handler)
}