const assert = require('assert');
const process = require('process');
const QueueModule = require('../QueueModule.js');

const myModule = new QueueModule({
  path: './test/queue',
  queue: 'test',
  name: 'test4',

  beforeStart: function () {
    console.log(`Module ${this.name}: started`);
  },

  beforeExit: function () {
    console.log(`Module ${this.name}: will exit`);
  },

  process: function (el) {
    console.log(`Module ${this.name}: queue element processed, cmd = ${el.cmd}, op_id = ${el.op_id}`);
  },
});

myModule.run();

setTimeout(() => {
  process.kill(process.pid);
}, 3000);
