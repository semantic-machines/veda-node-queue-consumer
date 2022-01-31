const assert = require('assert');
const {readFileSync} = require('fs');
const process = require('process');
const QueueModule = require('../QueueModule.js');

let OPTIONS;
try {
  OPTIONS = JSON.parse(readFileSync('./test/options.json'));
} catch (error) {
  console.error('Unable to read options.json');
  OPTIONS = {
    path: './test/queue',
    queue: 'test',
    name: 'test4',
    queueDelay: 1000,
    commitThreshold: 1000,
  };
}

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let counter = 0;

const myModule = new QueueModule({
  options: OPTIONS,

  beforeStart: async function () {
    await timeout(1000);
    console.log(`Module ${this.options.name}: started`);
  },

  beforeExit: async function () {
    console.log(`Module ${this.options.name}: will exit`);
    await timeout(1000);
    assert(counter === 39);
  },

  process: async function (el) {
    await timeout(10);
    counter++;
  },
});

myModule.run();

setTimeout(() => {
  process.kill(process.pid);
}, 3000);
