module.exports = (test, assert) => test('test2', () => {
  const QueueConsumer = require('../QueueConsumer.js');
  const myQueueConsumer = new QueueConsumer({
    path: './test/queue',
    queue: 'test',
    name: 'test2',
  });

  let i = 0;

  while (true) {
    const el = myQueueConsumer.pop();
    if (!el.cmd) {
      myQueueConsumer.commit();
      break;
    }
    if (i % 10 === 0) {
      myQueueConsumer.commit();
    }
    i++;
  }

  assert.equal(i, 39);
});
