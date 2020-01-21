import { WsJsonRpc } from "./wsJsonRpc";
import { IPubSub } from "./types";

export class PubSubRpc extends WsJsonRpc implements IPubSub {
    subscribe(topic: string, args: any[], handler: (result: any) => void) {
        const subscribePromise = this.exec("subscribe", [topic, ...args]);
        const subscriptionPromise = subscribePromise.then(id => {
            const subscription = this.on("subscription", (params: any) => {
                if (params.subscription === id) {
                    handler(params.result);
                }
            });

            return { subscription, id };
        });


        return {
            unsubscribe: () => {
                subscriptionPromise.then(({ subscription, id }) => {
                    subscription.off();
                    this.exec("unsubscribe", [id]);
                })
            }
        }
    }
}