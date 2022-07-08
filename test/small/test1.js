import QueueConsumer from '../../QueueConsumer.js';

export default (test, assert, log, options) => test('test1', () => {
  const myQueueConsumer = new QueueConsumer({
    ...options,
    name: 'test1',
  });

  let total = 0;
  let myPart;
  let maxPart;
  let restSize;

  (function processQueue () {
    myQueueConsumer.refreshQueue();
    maxPart = myQueueConsumer.getMaxPart();

    myPart = myQueueConsumer.getPart();
    myQueueConsumer.refreshPart(myPart);
    myQueueConsumer.setPart(myPart);
    restSize = myQueueConsumer.getRestSize();

    if (restSize === 0 ) {
      if (myPart < maxPart) {
        myQueueConsumer.setPart(++myPart);
        return processQueue();
      } else {
        return;
      }
    }

    for (let i = 0; i < restSize; i++) {
      myQueueConsumer.pop();
      total++;
      if (i === 0 || i === restSize - 1) {
        myQueueConsumer.commit();
      }
    }
    return processQueue();
  })();

  assert.equal(total, 39);
});
