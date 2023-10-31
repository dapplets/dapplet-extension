// A map to hold queues for each queueId
const queues: Map<symbol, Promise<any>> = new Map()

/**
 * Decorator that prevents concurrent execution of a method, ensuring that calls to the
 * method are queued and executed sequentially. Each unique `queueId` corresponds to a
 * separate queue. Methods with the same `queueId` will share the same execution queue.
 * If `queueId` is not provided, a unique queue is created for each decorated method
 * instance, which means calls to the same method on different instances do not share a queue.
 *
 * @param {symbol|string} [queueId=Symbol()] - The identifier for the queue. Methods with the
 *                                            same `queueId` will be queued together. If omitted,
 *                                            a unique symbol is generated for each method, meaning
 *                                            each method instance gets its own queue.
 *
 * @returns {Function} A decorator function that modifies the method descriptor to queue
 *                     method executions.
 *
 * @example
 * ```typescript
 * const QueueKey = Symbol()
 *
 * // Shared queue across instances
 * class TaskProcessor {
 *   \@MutexQueue(QueueKey)
 *   async processTask(task) {
 *     // processing task
 *   }
 * }
 *
 * const processor1 = new TaskProcessor();
 * const processor2 = new TaskProcessor();
 * processor1.processTask('task1'); // These tasks share a queue
 * processor2.processTask('task2'); // because they use the same queueId.
 * ```
 */
export function MutexQueue(queueId = Symbol()) {
  return function (_, __, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Wait for the last promise in the queue to resolve
      const lastPromise = queues.get(queueId) || Promise.resolve()
      let resolveQueuePromise: () => void

      // Create a new promise that will be resolved when this method call is complete
      const newQueuePromise = new Promise<void>((resolve) => {
        resolveQueuePromise = resolve
      })

      // Enqueue the new promise
      queues.set(queueId, newQueuePromise)

      try {
        // Wait for the last method in the queue to finish
        await lastPromise
        // Execute the original method
        return await originalMethod.apply(this, args)
      } finally {
        // Resolve the current promise in the queue
        resolveQueuePromise()
      }
    }

    return descriptor
  }
}
