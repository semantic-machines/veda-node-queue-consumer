import QueueModule from './QueueModule.js';
import log from 'loglevel';
import options from './.options.js';

log.setLevel(options.logLevel || 'warn');

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class MyModule extends QueueModule {
  constructor (options) {
    super(options);
  }

  counter = 0;

  async beforeStart () {
    await timeout(1000); // Some async stuff
    log.debug(new Date().toISOString(), `${this.options.name}: started`);
  }

  async beforeStop () {
    log.debug(new Date().toISOString(), `${this.options.name}: will exit`);
    await timeout(1000); // Some async stuff
  }

  async process (el) {
    this.counter++;
    await timeout(100); // Some async stuff
    log.debug(new Date().toISOString(), `${this.options.name}:`, this.counter, el.op_id, el.cmd);
  }
};

const myModule = new MyModule(options);
myModule.start();
