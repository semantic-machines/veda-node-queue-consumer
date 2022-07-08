import QueueConsumer from '../../QueueConsumer.js';

export default (test, assert, log, options) => test('test2', () => {
  const myQueueConsumer = new QueueConsumer({
    ...options,
    name: 'test2',
  });

  let total = 0;

  while (true) {
    const el = myQueueConsumer.pop();
    if (!el.cmd) {
      myQueueConsumer.commit();
      break;
    }
    if (total % 10 === 0) {
      myQueueConsumer.commit();
    }
    total++;
  }

  assert.equal(total, 39);
});
