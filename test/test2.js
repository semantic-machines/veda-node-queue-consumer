const assert = require('assert');
const QueueConsumer = require('../QueueConsumer.js');
const myQueueConsumer = new QueueConsumer('./test/queue', 'test', 'test2');

console.time('Test2');

let i = 0;

while (true) {
  const el = myQueueConsumer.pop();
  if (!el.cmd) {
    myQueueConsumer.commit();
    console.log('Queue end reached');
    break;
  }
  if (i % 10 === 0) {
    myQueueConsumer.commit();
  }
  i++;
}

assert(i === 39);
console.log('Total elements processed:', i);
console.timeEnd('Test2');
