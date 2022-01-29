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

const myModule = new QueueModule({
  options: OPTIONS,

  beforeStart: function () {
    console.log(`Module ${this.options.name}: started`);
  },

  beforeExit: function () {
    console.log(`Module ${this.options.name}: will exit`);
  },

  process: function (el) {
    console.log(`Module ${this.options.name}: queue element processed, cmd = ${el.cmd}, op_id = ${el.op_id}`);
  },
});

myModule.run();

setTimeout(() => {
  process.kill(process.pid);
}, 3000);
