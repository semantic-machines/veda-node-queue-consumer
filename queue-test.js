const Consumer = require('./Consumer.js');

const consumer = new Consumer('./queue', 'node-test', 'individuals-flow');

console.time('test');


var part_id = 0
consumer.refreshInfoQueue()
var max_part_id = consumer.getQueuePartId()
console.log('last queue_part_id=' + max_part_id);

// open first queue part
consumer.queueOpenPart(0)

var total_counter = 0

while (true) {
  part_id = consumer.getPartId();
  console.log('part_id=' + part_id);

  consumer.refreshInfoOfPart(part_id);

  var batchSize = consumer.getBatchSize();
  console.log('batch_size=' + batchSize);
  var prepare_size = batchSize;    

  for (let i = 0; i < prepare_size; i++) {
    let el = consumer.pop()

    if (batchSize == 1) {
     part_id = consumer.getPartId();
     console.log('#2 part_id=' + part_id);
    }        

    total_counter += 1
    if (i === 0 || i === prepare_size - 1) console.log(el);
    consumer.next(i === batchSize - 1);
  }

  if (part_id >= max_part_id) {
    break;
  }    

}

console.log(total_counter)
