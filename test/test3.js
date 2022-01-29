const assert = require('assert');
const Consumer = require('../Consumer.js');
const myConsumer = new Consumer('./test/queue', 'test3', 'test');

const QUEUE_DELAY = 1000;
let MAX_CALLS = 3;

console.time('Test3');

let i = 0;

(function processQueue () {
  if (!MAX_CALLS) {
    console.log('Max calls reached, exit');
    return;
  }

  const el = myConsumer.pop();

  if (!el.cmd) {
    myConsumer.commit();
    console.log(`Queue end reached, waiting for ${QUEUE_DELAY / 1000}s`);
    MAX_CALLS--;
    return setTimeout(processQueue, QUEUE_DELAY);
  }

  i++;

  return processQueue();
})();

assert(i === 39);
console.log('Total elements processed:', i);
console.timeEnd('Test3');
