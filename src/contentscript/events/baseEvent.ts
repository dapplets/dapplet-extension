/**
 * @description
 * The base type for all module-level events used by the EventBus system.
 * */
export type BaseEvent = {
  namespace: string
  type: string
}
