const QueueFeeder = require('./QueueFeeder.js');

class QueueModule {
  constructor (module) {
    this.module = module;

    if (typeof module.beforeStart === 'function') {
      this.beforeStart = module.beforeStart;
    }

    if (typeof beforeExit === 'function') {
      this.beforeExit = module.beforeExit;
    }

    if (typeof process === 'function') {
      this.process = module.process;
    }
  }

  beforeStart () {
    console.log(`QueueModule: '${this.module.options.name}' has started`);
  }

  beforeExit () {
    console.log(`QueueModule: '${this.module.options.name}' will exit`);
  }

  process (el) {
    console.log(`QueueModule: queue element processed, cmd = ${el.cmd}, op_id = ${el.op_id}`);
  }

  run () {
    const myQueueFeeder = new QueueFeeder(this.module);
    myQueueFeeder.run();
  }
};

module.exports = QueueModule;
