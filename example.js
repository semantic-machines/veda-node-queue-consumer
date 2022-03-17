const QueueModule = require('./QueueModule.js');
const log = require('loglevel');
const options = require('./.options.js');

log.setLevel(options.logLevel || 'warn');

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class MyModule extends QueueModule {
  constructor (options) {
    super(options);
  }

  counter = 0;

  async beforeStart () {
    await timeout(1000);
    log.warn(new Date().toISOString(), `${this.options.name}: started`);
  }

  async beforeExit () {
    log.warn(new Date().toISOString(), `${this.options.name}: will exit`);
    await timeout(1000);
  }

  async process (el) {
    this.counter++;
    log.warn(new Date().toISOString(), `${this.options.name}:`, this.counter, el.op_id, el.cmd);
  }
};

const myModule = new MyModule(options);
myModule.run();
