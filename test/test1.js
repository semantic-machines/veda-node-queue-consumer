const assert = require('assert');
const QueueConsumer = require('../QueueConsumer.js');
const myQueueConsumer = new QueueConsumer('./test/queue', 'test', 'test1');

console.time('Test1');

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
      console.log('Queue end reached');
      return;
    }
  }

  console.log(`Queue max part: ${maxPart}, my part: ${myPart}, rest: ${restSize}`);

  for (let i = 0; i < restSize; i++) {
    const el = myQueueConsumer.pop();
    total++;
    if (i === 0 || i === restSize - 1) {
      myQueueConsumer.commit();
    }
  }
  return processQueue();
})();

console.log('Total', total);

assert(total === 39);
console.log('Total elements processed:', total);
console.timeEnd('Test1');
