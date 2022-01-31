const process = require('process');
const QueueConsumer = require('./QueueConsumer.js');

class QueueFeeder {
  constructor (module) {
    this.consumer = new QueueConsumer(module.options);
    this.module = module;
    this.processed = 0;
    this.exitSignal = 0;
  }

  async run () {
    console.log(`QueueFeeder: '${this.module.options.name}' will start`);

    try {
      await this.module.beforeStart();
    } catch (error) {
      console.error(`QueueFeeder: ${this.module.options.name} failed to start, ${error.stack}`);
      process.exit(1);
    }

    const exitHandler = (signal) => {
      console.log(`QueueFeeder: signal ${signal} received`);
      this.exitSignal = signal;
    };
    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);

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

  suspend () {
    this.consumer.commit();
    console.log(`QueueFeeder: queue end reached, suspend`);
    setTimeout(this.resume.bind(this), this.module.options.queueDelay);
  }

  resume () {
    console.log(`QueueFeeder: queue update received, resume`);
    this.processQueue();
  }

  async processQueue () {
    while (true) {
      if (this.exitSignal) {
        return this.exit();
      }

      const el = this.consumer.pop();

      if (!el.cmd) {
        return this.suspend();
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
    }
  }
}

module.exports = QueueFeeder;
