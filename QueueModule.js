const QueueFeeder = require('./QueueFeeder.js');

class QueueModule {
  constructor ({path, queue, name, beforeStart, beforeExit, process}) {
    this.path = path;
    this.queue = queue;
    this.name = name;

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

  beforeStart () {
    console.log(`QueueModule: '${this.name}' has started`);
  }

  beforeExit () {
    console.log(`QueueModule: '${this.name}' will exit`);
  }

  process (el) {
    console.log(`QueueModule: queue element processed, cmd = ${el.cmd}, op_id = ${el.op_id}`);
  }

  run () {
    const myQueueFeeder = new QueueFeeder(this);
    myQueueFeeder.run();
  }
};

module.exports = QueueModule;
