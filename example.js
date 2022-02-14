import {readFileSync} from 'fs';
import QueueModule from './QueueModule.js';
import log from 'loglevel';

let OPTIONS;
try {
  OPTIONS = JSON.parse(readFileSync('./options.json'));
} catch (error) {
  console.error(new Date().toISOString(), 'Unable to read options.json');
  process.exit(1);
}

log.setLevel(OPTIONS.logLevel || 'warn');

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

const myModule = new MyModule(OPTIONS);
myModule.run();
