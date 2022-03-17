const log = require('loglevel');
const QueueModule = require('../QueueModule.js');
const options = require('./.options.js');

module.exports = (test, assert) => test('test4', async () => {
  log.setLevel('error');

  class MyModule extends QueueModule {
    constructor (options) {
      super(options);
    }
  };

  const myModule = new MyModule(options);
  myModule.run();
});
