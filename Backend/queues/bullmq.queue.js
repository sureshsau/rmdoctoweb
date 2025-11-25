import { Queue, Worker } from "bullmq";
import { QueueInterface } from "./queue.interface.js";

export class BullMQQueueService extends QueueInterface {
  constructor(connection) {
    super();
    this.connection = connection;
    this.queues = {};
  }

  getQueue(queueName) {
    if (!this.queues[queueName]) {
      this.queues[queueName] = new Queue(queueName, {
        connection: this.connection,
      });
    }
    return this.queues[queueName];
  }

  async publish(queueName, payload, options = {}, jobName = "job") {
  const queue = this.getQueue(queueName);
  return queue.add(jobName, payload, options);
}

  subscribe(queueName, handler, options = {}) {
  const worker = new Worker(queueName, handler, {
    connection: this.connection,
    ...options,
  });
  return worker;
}
}

