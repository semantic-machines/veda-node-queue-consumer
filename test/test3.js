module.exports = (test, assert) => test('test3', () => {
  const QueueConsumer = require('../QueueConsumer.js');
  const myQueueConsumer = new QueueConsumer({
    path: './test/queue',
    queue: 'test',
    name: 'test3',
  });

  const QUEUE_DELAY = 1000;
  let MAX_CALLS = 3;

  let i = 0;

  (function processQueue () {
    if (!MAX_CALLS) {
      return;
    }

    const el = myQueueConsumer.pop();

    if (!el.cmd) {
      myQueueConsumer.commit();
      MAX_CALLS--;
      return setTimeout(processQueue, QUEUE_DELAY);
    }

    i++;

    return processQueue();
  })();

  assert.equal(i, 39);
});
