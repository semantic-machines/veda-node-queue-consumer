const assert = require('assert');
const Consumer = require('../Consumer.js');
const myConsumer = new Consumer('./test/queue', 'test1', 'test');

console.time('Test1');

let total = 0;
let myPart;
let maxPart;
let restSize;

(function processQueue () {
  myConsumer.refreshQueue();
  maxPart = myConsumer.getMaxPart();

  myPart = myConsumer.getPart();
  myConsumer.refreshPart(myPart);
  myConsumer.setPart(myPart);
  restSize = myConsumer.getRestSize();

  if (restSize === 0 ) {
    if (myPart < maxPart) {
      myConsumer.setPart(++myPart);
      return processQueue();
    } else {
      console.log('Queue end reached');
      return;
    }
  }

  console.log(`Queue max part: ${maxPart}, my part: ${myPart}, rest: ${restSize}`);

  for (let i = 0; i < restSize; i++) {
    const el = myConsumer.pop();
    total++;
    if (i === 0 || i === restSize - 1) {
      myConsumer.commit();
    }
  }
  return processQueue();
})();

console.log('Total', total);

assert(total === 39);
console.log('Total elements processed:', total);
console.timeEnd('Test1');
