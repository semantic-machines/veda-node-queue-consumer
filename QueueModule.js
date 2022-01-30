const QueueFeeder = require('./QueueFeeder.js');

class QueueModule {
  constructor ({options, beforeStart, beforeExit, process}) {
    this.options = options;

    if (typeof beforeStart === 'function') {
      this.beforeStart = beforeStart;
    }

    if (typeof beforeExit === 'function') {
      this.beforeExit = beforeExit;
    }

    if (typeof process === 'function') {
      this.process = process;
    }
  }

  async beforeStart () {
    console.log(`QueueModule: '${this.options.name}' has started`);
  }

  async beforeExit () {
    console.log(`QueueModule: '${this.options.name}' will exit`);
  }

  async process (el) {
    console.log(`QueueModule: queue element processed, cmd = ${el.cmd}, op_id = ${el.op_id}`);
  }

  run () {
    const myQueueFeeder = new QueueFeeder(this);
    myQueueFeeder.run();
  }
};

module.exports = QueueModule;
