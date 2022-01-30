const process = require('process');
const QueueConsumer = require('./QueueConsumer.js');

class QueueFeeder {
  constructor (module) {
    this.consumer = new QueueConsumer(module.options);
    this.module = module;
    this.processed = 0;
  }

  static exitSignal = 0;

  async run () {
    console.log(`QueueFeeder: '${this.module.options.name}' will start`);

    try {
      await this.module.beforeStart();
    } catch (error) {
      console.error(`QueueFeeder: ${this.module.options.name} failed to start, ${error.stack}`);
      process.exit(1);
    }

    this.processQueue();
  }

  async exit () {
    this.consumer.commit();

    try {
      await this.module.beforeExit();
      console.log(`QueueFeeder: '${this.module.options.name}' has exited`);
    } catch (error) {
      console.log(`QueueFeeder: '${this.module.options.name}' failed to exit normally, ${error.stack}`);
    }

    process.exit(1);
  }

  async processQueue () {
    if (QueueFeeder.exitSignal) {
      return this.exit();
    }

    const el = this.consumer.pop();

    if (!el.cmd) {
      this.consumer.commit();
      console.log(`QueueFeeder: queue end reached, waiting for ${this.module.options.queueDelay / 1000}s`);
      return setTimeout(this.processQueue.bind(this), this.module.options.queueDelay);
    }

    this.processed++;

    try {
      await this.module.process(el);
      if (this.processed % this.module.options.commitThreshold === 0) {
        this.consumer.commit();
      }
    } catch (error) {
      console.error(`QueueFeeder: ${this.module.options.name} failed to process queue element ${el}, ${error.stack}`);
      process.exit(1);
    }

    return this.processQueue();
  }
}

const exitHandler = (signal) => {
  console.log(`QueueFeeder: signal ${signal} received`);
  QueueFeeder.exitSignal = signal;
};
process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

module.exports = QueueFeeder;
