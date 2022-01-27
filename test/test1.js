const assert = require('assert');
const Consumer = require('../Consumer.js');
const consumer = new Consumer('./test/queue', 'test1', 'test');

console.time('test1');

consumer.refreshQueue();
const maxPart = consumer.getMaxPart();
console.log('max queue part = ', maxPart);

let total = 0;

while (true) {
  let part = consumer.getPart();
  console.log('part = ', part);

  consumer.refreshPart(part);

  const restSize = consumer.getRestSize();
  console.log('rest size = ', restSize);

  for (let i = 0; i < restSize; i++) {
    let el = consumer.pop();

    total++;

    if (i === 0 || i === restSize - 1) {
      console.log(el);
    }

    if (i === restSize - 1) {
      consumer.commit();
    }
  }

  if (part >= maxPart) {
    break;
  }
}

assert(total === 39);
console.log('Total elements processed:', total);
console.timeEnd('test1');
