const Consumer = require('./Consumer.js');
const consumer = new Consumer('./queue', 'node-test', 'individuals-flow');

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
    consumer.commit(i === restSize - 1);
  }

  if (part >= maxPart) {
    break;
  }
}

console.log(total);
console.timeEnd('test');
