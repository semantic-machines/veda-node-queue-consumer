const {readFileSync} = require('fs');
const QueueModule = require('./QueueModule.js');
const log = require('loglevel');

let OPTIONS;
try {
  OPTIONS = JSON.parse(readFileSync('./options.json'));
} catch (error) {
  console.error(new Date().toISOString(), 'Unable to read options.json');
  process.exit(1);
}

log.setLevel(OPTIONS.logLevel || 'warn');

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let counter = 0;

const myModule = new QueueModule({
  options: OPTIONS,

  beforeStart: async function () {
    await timeout(1000);
    log.warn(new Date().toISOString(), `${this.options.name}: started`);
  },

  beforeExit: async function () {
    log.warn(new Date().toISOString(), `${this.options.name}: will exit`);
    await timeout(1000);
  },

  process: async function (el) {
    counter++;
    log.warn(new Date().toISOString(), `${this.options.name}:`, counter, el.op_id, el.cmd);
  },
});

myModule.run();
