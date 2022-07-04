import log from 'loglevel';
import QueueFeeder from './QueueFeeder.js';

class QueueModule {
  constructor (options) {
    this.options = options;
    this.#queueFeeder = new QueueFeeder(this);
  }

  #queueFeeder;

  async beforeStart () {
    log.warn(new Date().toISOString(), `QueueModule: '${this.options.name}' has started`);
  }

  async beforeStop () {
    log.warn(new Date().toISOString(), `QueueModule: '${this.options.name}' will exit`);
  }

  async process (el) {
    log.warn(new Date().toISOString(), `QueueModule: queue element processed, cmd = ${el.cmd}, op_id = ${el.op_id}`);
  }

  async start () {
    return this.#queueFeeder.start();
  }

  async stop () {
    return this.#queueFeeder.stop();
  }
};

export default QueueModule;
