export class QueueInterface {
  publish(queueName, payload) {
    throw new Error("publish() must be implemented");
  }

  subscribe(queueName, handler) {
    throw new Error("subscribe() must be implemented");
  }
}
