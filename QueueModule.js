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

  async beforeExit () {
    log.warn(new Date().toISOString(), `QueueModule: '${this.options.name}' will exit`);
  }

  async process (el) {
    log.warn(new Date().toISOString(), `QueueModule: queue element processed, cmd = ${el.cmd}, op_id = ${el.op_id}`);
  }

  async run () {
    return this.#queueFeeder.run();
  }

  async exit () {
    return this.#queueFeeder.exit();
  }
};

export default QueueModule;
