module.exports = (test, assert) => test('test4', async () => {
  const {readFileSync} = require('fs');
  const process = require('process');
  const QueueModule = require('../QueueModule.js');

  let OPTIONS;
  try {
    OPTIONS = JSON.parse(readFileSync('./test/options.json'));
  } catch (error) {
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
    },

    beforeExit: async function () {
      assert.equal(counter, 39);
    },

    process: async function (el) {
      counter++;
    },
  });

  myModule.run();

  await timeout(1000);
  process.kill(process.pid);
});
