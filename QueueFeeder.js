import log from 'loglevel';
import nano from 'nanomsg';
import process from 'process';
import QueueConsumer from './QueueConsumer.js';

class QueueFeeder {
  constructor (module) {
    this.consumer = new QueueConsumer(module.options);
    this.module = module;
    this.subscriber = nano.socket('sub');
    this.processed = 0;
    this.timeout = 0;
    this.state = 'init';
  }

  async start () {
    log.info(new Date().toISOString(), `QueueFeeder: '${this.module.options.name}' will start`);

    try {
      await this.module.beforeStart();
    } catch (error) {
      log.error(new Date().toISOString(), `QueueFeeder: ${this.module.options.name} failed to start, ${error.stack}`);
      process.exit(1);
    }

    // Listen to OS signals
    const stopHandler = (signal) => {
      log.warn(new Date().toISOString(), `QueueFeeder: signal ${signal} received`);
      if (this.state !== 'process') {
        this.stop();
      }
      this.state = 'stop';
    };
    process.on('SIGINT', stopHandler);
    process.on('SIGTERM', stopHandler);

    // Listen to queue update notifications
    this.subscriber.connect(this.module.options.notifyChannelUrl);
    this.subscriber.on('data', () => this.resume());

    this.processQueue();
  }

  async stop () {
    this.consumer.commit();

    try {
      await this.module.beforeStop();
      log.info(new Date().toISOString(), `QueueFeeder: '${this.module.options.name}' has stopped`);
    } catch (error) {
      log.error(new Date().toISOString(), `QueueFeeder: '${this.module.options.name}' failed to stop normally, ${error.stack}`);
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
    if (this.state !== 'process' && this.state !== 'stop') {
      log.debug(new Date().toISOString(), 'QueueFeeder: queue update received, resume');
      this.processQueue();
    }
  }

  async processQueue () {
    while (true) {
      if (this.state === 'stop') {
        return this.stop();
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
        log.error(new Date().toISOString(), `QueueFeeder: ${this.module.options.name} failed to process queue element ${JSON.stringify(el)}, ${error.stack}`);
        process.exit(1);
      }
    }
  }
}

export default QueueFeeder;
