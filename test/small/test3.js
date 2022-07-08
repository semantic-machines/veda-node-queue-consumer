import QueueModule from '../../QueueModule.js';

export default (test, assert, log, options) => test('test3', async () => {
  log.setLevel('error');

  class MyModule extends QueueModule {
    constructor (options) {
      super(options);
    }
  };

  const myModule = new MyModule(options);
  myModule.start();
});
