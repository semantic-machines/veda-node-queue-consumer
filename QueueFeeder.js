const process = require('process');
const QueueConsumer = require('./QueueConsumer.js');

class QueueFeeder {
  constructor (module) {
    this.consumer = new QueueConsumer(module.options);
    this.module = module;
    this.processed = 0;
  }

  static exitSignal = 0;

  run () {
    console.log(`QueueFeeder: '${this.module.options.name}' will start`);
    this.module.beforeStart();
    this.processQueue();
  }

  exit () {
    this.consumer.commit();
    this.module.beforeExit();
    console.log(`QueueFeeder: '${this.module.options.name}' has exited`);
    process.exit(1);
  }

  processQueue () {
    if (QueueFeeder.exitSignal) {
      this.exit();
    }

    const el = this.consumer.pop();

    if (!el.cmd) {
      this.consumer.commit();
      console.log(`QueueFeeder: queue end reached, waiting for ${this.module.options.queueDelay / 1000}s`);
      return setTimeout(this.processQueue.bind(this), this.module.options.queueDelay);
    }

    this.processed++;

    try {
      this.module.process(el);
      if (this.processed % this.module.options.commitThreshold === 0) {
        this.consumer.commit();
      }
    } catch (error) {
      console.error(`QueueFeeder: module ${this.module.options.name} failed to process queue element ${el}, ${error}`);
      process.exit(1);
    }

    return this.processQueue();
  }
}

const handler = (signal) => {
  console.log(`QueueFeeder: signal ${signal} received`);
  QueueFeeder.exitSignal = signal;
};
process.on('SIGINT', handler);
process.on('SIGTERM', handler);

module.exports = QueueFeeder;
