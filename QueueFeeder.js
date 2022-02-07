const log = require('loglevel');
const nano = require('nanomsg');
const process = require('process');
const QueueConsumer = require('./QueueConsumer.js');

class QueueFeeder {
  constructor (module) {
    this.consumer = new QueueConsumer(module.options);
    this.module = module;
    this.subscriber = nano.socket('sub');
    this.processed = 0;
    this.timeout = 0;
    this.state = 'init';
  }

  async run () {
    log.info(new Date().toISOString(), `QueueFeeder: '${this.module.options.name}' will start`);

    try {
      await this.module.beforeStart();
    } catch (error) {
      log.error(new Date().toISOString(), `QueueFeeder: ${this.module.options.name} failed to start, ${error.stack}`);
      process.exit(1);
    }

    // Listen to OS signals
    const exitHandler = (signal) => {
      log.warn(new Date().toISOString(), `QueueFeeder: signal ${signal} received`);
      if (this.state !== 'process') {
        this.exit();
      }
      this.state = 'exit';
    };
    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);

    // Listen to queue update notifications
    this.subscriber.connect(this.module.options.notifyChannelUrl);
    this.subscriber.on('data', () => this.resume());

    this.processQueue();
  }

  async exit () {
    this.consumer.commit();

    try {
      await this.module.beforeExit();
      log.info(new Date().toISOString(), `QueueFeeder: '${this.module.options.name}' has exited`);
    } catch (error) {
      log.error(new Date().toISOString(), `QueueFeeder: '${this.module.options.name}' failed to exit normally, ${error.stack}`);
    }

    // Close queue update notifications socket
    this.subscriber.close();
    this.subscriber.shutdown();

    process.exit(0);
  }

  suspend () {
    this.state = 'suspend';
    this.consumer.commit();
    log.debug(new Date().toISOString(), 'QueueFeeder: queue end reached, suspend');
    if (this.timeout) {
      this.timeout = clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(this.resume.bind(this), this.module.options.queueDelay);
  }

  resume () {
    if (this.state !== 'process' && this.state !== 'exit') {
      log.debug(new Date().toISOString(), 'QueueFeeder: queue update received, resume');
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
        log.error(new Date().toISOString(), `QueueFeeder: ${this.module.options.name} failed to process queue element ${el}, ${error.stack}`);
        process.exit(1);
      }
    }
  }
}

module.exports = QueueFeeder;
