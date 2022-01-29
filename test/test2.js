const assert = require('assert');
const Consumer = require('../Consumer.js');
const myConsumer = new Consumer('./test/queue', 'test2', 'test');

console.time('Test2');

let i = 0;

while (true) {
  const el = myConsumer.pop();
  if (!el.cmd) {
    myConsumer.commit();
    console.log('Queue end reached');
    break;
  }
  if (i % 10 === 0) {
    myConsumer.commit();
  }
  i++;
}

assert(i === 39);
console.log('Total elements processed:', i);
console.timeEnd('Test2');
