const nano = require('nanomsg');
const process = require('process');
const QueueConsumer = require('./QueueConsumer.js');

class QueueFeeder {
  constructor (module) {
    this.consumer = new QueueConsumer(module.options);
    this.module = module;
    this.subscriber = nano.socket('sub');
    this.processed = 0;
    this.state = 'init';
  }

  async run () {
    console.log(`QueueFeeder: '${this.module.options.name}' will start`);

    try {
      await this.module.beforeStart();
    } catch (error) {
      console.error(`QueueFeeder: ${this.module.options.name} failed to start, ${error.stack}`);
      process.exit(1);
    }

    // Listen to OS signals
    const exitHandler = (signal) => {
      console.log(`QueueFeeder: signal ${signal} received`);
      if (this.state !== 'process') {
        this.exit();
      }
      this.state = 'exit';
    };
    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);

    // Listen to queue update notifications
    this.subscriber.connect(this.module.options.notifyChannel);
    this.subscriber.on('data', () => this.resume());

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
    this.state = 'suspend';
    this.consumer.commit();
    console.log('QueueFeeder: queue end reached, suspend');
    //setTimeout(this.resume.bind(this), this.module.options.queueDelay);
  }

  resume () {
    if (this.state !== 'process' && this.state !== 'exit') {
      console.log('QueueFeeder: queue update received, resume');
      this.processQueue();
    }
  }

  async processQueue () {
    while (true) {
      if (this.state === 'exit') {
        return this.exit();
      }

      this.state = 'process';

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