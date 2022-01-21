"use strict";

const { consumerNew, consumerGetId, consumerGetInfoOfPart, consumerGetBatchSize, consumerPopElement, consumerNext } = require("./index.node");

class Consumer {
  constructor (path, name, queue) {
    this.consumer = consumerNew(path, name, queue);
  }

  getBatchId () {
    return consumerGetId(this.consumer);
  }

  getBatchSize () {
    return consumerGetBatchSize(this.consumer);
  }

  pop () {
    return consumerPopElement(this.consumer);
  }

  next (commit) {
    return consumerNext(this.consumer, commit);
  }
}

module.exports = Consumer;
