const assert = require('assert');
const Consumer = require('../Consumer.js');
const myConsumer = new Consumer('./test/queue', 'test1', 'test');
// const queueDelay = 1000;

console.time('test1');

let total = 0;
let myPart;
let maxPart;
let restSize;

(function processQueue () {
  myConsumer.refreshQueue();
  maxPart = myConsumer.getMaxPart();

  myPart = myConsumer.getPart();
  myConsumer.setPart(myPart);
  myConsumer.refreshPart(myPart);
  restSize = myConsumer.getRestSize();

  if (restSize === 0 ) {
    if (myPart < maxPart) {
      myConsumer.setPart(++myPart);
      return processQueue();
    } else {
      // console.log(`queue end reached, waiting for ${queueDelay/1000}s`);
      // return setTimeout(processQueue, queueDelay);
      console.log('queue end reached');
      return;
    }
  }

  console.log(`queue max part: ${maxPart}, my part: ${myPart}, rest: ${restSize}`);

  for (let i = 0; i < restSize; i++) {
    const el = myConsumer.pop();
    total++;
    if (i === 0 || i === restSize - 1) {
      console.log(el);
      myConsumer.commit();
    }
  }
  return processQueue();
})();

console.log('total', total);

assert(total === 39);
console.log('Total elements processed:', total);
console.timeEnd('test1');
