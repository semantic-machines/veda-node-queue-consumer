"use strict";

const { consumerQueueOpenPart, consumerNew, consumerGetPartId, consumerGetQueuePartId, consumerRefreshInfoOfPart, consumerRefreshInfoQueue, consumerGetBatchSize, consumerPopElement, consumerNext } = require("./index.node");

class Consumer {
  constructor (path, name, queue) {
    this.consumer = consumerNew(path, name, queue);
  }

  getPartId () {
    return consumerGetPartId(this.consumer);
  }

  getQueuePartId () {
    return consumerGetQueuePartId(this.consumer);
  }

  getBatchSize () {
    return consumerGetBatchSize(this.consumer);
  }

  refreshInfoOfPart(partId) {
    return consumerRefreshInfoOfPart(this.consumer, partId);
  }

  queueOpenPart(partId) {
    return consumerQueueOpenPart(this.consumer, partId);
  }

  pop () {
    return consumerPopElement(this.consumer);
  }

  next (commit) {
    return consumerNext(this.consumer, commit);
  }

  refreshInfoQueue () {
    return consumerRefreshInfoQueue(this.consumer);
  }
}

module.exports = Consumer;
