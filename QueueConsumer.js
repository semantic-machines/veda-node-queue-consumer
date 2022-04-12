import {createRequire} from 'module';

const require = createRequire(import.meta.url);

//import bindings from 'bindings';

const {
  consumerQueueOpenPart,
  consumerNew,
  consumerGetPartId,
  consumerGetQueuePartId,
  consumerRefreshInfoOfPart,
  consumerRefreshInfoQueue,
  consumerGetBatchSize,
  consumerPopElement,
  consumerCommit,
//} = bindings('consumer.node');
} = require('./consumer.node');

class QueueConsumer {
  constructor ({path, queue, name}) {
    this.consumer = consumerNew(path, name, queue);
  }

  getPart () {
    return consumerGetPartId(this.consumer);
  }

  setPart (part) {
    return consumerQueueOpenPart(this.consumer, part);
  }

  getRestSize () {
    return consumerGetBatchSize(this.consumer);
  }

  getMaxPart () {
    return consumerGetQueuePartId(this.consumer);
  }

  refreshPart (part) {
    return consumerRefreshInfoOfPart(this.consumer, part);
  }

  refreshQueue () {
    return consumerRefreshInfoQueue(this.consumer);
  }

  pop () {
    return consumerPopElement(this.consumer);
  }

  commit () {
    return consumerCommit(this.consumer);
  }
}

export default QueueConsumer;
