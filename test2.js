const Consumer = require('./Consumer.js');
const myConsumer = new Consumer('./queue', 'node-test', 'individuals-flow');

console.time('test2');

let i = 0;

while (true) {
  let el = myConsumer.pop();
  if (!el.cmd) {
    myConsumer.commit(true);
    break;
  }
  if (i % 10000 === 0) {
    console.log(el);
    myConsumer.commit(true);
  }
  i++;
}

console.log('Total elements processed', i);
console.timeEnd('test');
