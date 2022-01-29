const process = require('process');
const QueueConsumer = require('./QueueConsumer.js');
const QUEUE_DELAY = 1000;
const COMMIT_THRESHOLD = 100;

class QueueFeeder {
  constructor (path, queue, module) {
    this.consumer = new QueueConsumer(path, queue, module.name);
    this.module = module;
    this.count = 0;
  }

  static exitSignal = 0;

  run () {
    console.log(`QueueFeeder: starting module ${this.module.name}`);
    this.module.beforeStart();
    this.processQueue();
  }

  exit () {
    this.consumer.commit();
    this.module.beforeExit(QueueFeeder.exitSignal);
    console.log(`QueueFeeder: exit module ${this.module.name}`);
    process.exit(1);
  }

  processQueue () {
    if (QueueFeeder.exitSignal) {
      this.exit();
    }

    const el = this.consumer.pop();

    if (!el.cmd) {
      this.consumer.commit();
      console.log(`Queue end reached, waiting for ${QUEUE_DELAY / 1000}s`);
      return setTimeout(this.processQueue.bind(this), QUEUE_DELAY);
    }

    this.count++;

    try {
      this.module.process(el);
      if (this.count % COMMIT_THRESHOLD === 0) {
        this.consumer.commit();
      }
    } catch (error) {
      console.log(`Error: Module ${this.module.name} failed to process queue element ${el}, ${error}`);
      process.exit(1);
    }

    return this.processQueue();
  }
}

const handler = (signal) => {
  QueueFeeder.exitSignal = signal;
};
process.on('SIGINT', handler);
process.on('SIGTERM', handler);

module.exports = QueueFeeder;
