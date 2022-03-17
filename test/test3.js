import log from 'loglevel';
import QueueModule from '../QueueModule.js';
import options from './.options.js';

export default (test, assert) => test('test4', async () => {
  log.setLevel('error');

  class MyModule extends QueueModule {
    constructor (options) {
      super(options);
    }
  };

  const myModule = new MyModule(options);
  myModule.run();
});
