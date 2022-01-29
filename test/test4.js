const QueueFeeder = require('../QueueFeeder.js');

const myModule = {
  name: 'test4',

  beforeStart: function () {
    console.log(`Module ${this.name} started`);
  },

  beforeExit: function (code) {
    console.log(`Module exiting with code ${code}`);
  },

  process: function (el) {
    console.log(el);
  },
};

const myQueueFeeder = new QueueFeeder('./test/queue', 'test', myModule);
myQueueFeeder.run();
