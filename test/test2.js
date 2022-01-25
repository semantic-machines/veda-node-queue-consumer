const assert = require('assert');
const Consumer = require('../Consumer.js');
const myConsumer = new Consumer('./test/queue', 'test2', 'test');

console.time('test2');

let i = 0;

while (true) {
  let el = myConsumer.pop();
  if (!el.cmd) {
    myConsumer.commit(true);
    break;
  }
  if (i % 10 === 0) {
    myConsumer.commit(true);
  }
  i++;
}

assert(i === 39);
console.log('Total elements processed:', i);
console.timeEnd('test2');
