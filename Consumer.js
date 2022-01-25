"use strict";

const { consumerQueueOpenPart, consumerNew, consumerGetPartId, consumerGetQueuePartId, consumerRefreshInfoOfPart, consumerRefreshInfoQueue, consumerGetBatchSize, consumerPopElement, consumerNext } = require("./index.node");

class Consumer {
  constructor (path, name, queue) {
    this.consumer = consumerNew(path, name, queue);
  }

  getPart () {
    return consumerGetPartId(this.consumer);
  }

  refreshPart(part) {
    return consumerRefreshInfoOfPart(this.consumer, part);
  }

  getRestSize () {
    return consumerGetBatchSize(this.consumer);
  }

  refreshQueue () {
    return consumerRefreshInfoQueue(this.consumer);
  }

  getMaxPart () {
    return consumerGetQueuePartId(this.consumer);
  }

  queueOpenPart(part) {
    return consumerQueueOpenPart(this.consumer, part);
  }

  pop () {
    return consumerPopElement(this.consumer);
  }

  commit (toWrite) {
    return consumerNext(this.consumer, toWrite);
  }

}

module.exports = Consumer;
