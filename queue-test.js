const Consumer = require('./Consumer.js');

const consumer = new Consumer('./queue', 'node-test', 'individuals-flow');

console.time('test');

while (true) {
  const batchId = consumer.getBatchId();
  console.log(batchId);

  const batchSize = consumer.getBatchSize();
  console.log(batchSize);

  if (!batchSize) {
    console.timeEnd('test');
    return;
  }

  for (let i = 0; i < batchSize; i++) {
    let el = consumer.pop();
    if (i === 0 || i === batchSize - 1) console.log(el);
    //consumer.next(i === batchSize - 1);
    consumer.next(true);
  }

  consumer.getInfoOfPart(batchId);
}
