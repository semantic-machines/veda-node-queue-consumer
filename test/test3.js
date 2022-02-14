import {readFileSync} from 'fs';
import log from 'loglevel';
import QueueModule from '../QueueModule.js';

export default (test, assert) => test('test4', async () => {
  let OPTIONS;
  try {
    OPTIONS = JSON.parse(readFileSync('./test/options.json'));
  } catch (error) {
    OPTIONS = {
      path: './test/queue',
      queue: 'test',
      name: 'test3',
      queueDelay: 0,
      commitThreshold: 1000,
    };
  }

  log.setLevel('error');

  class MyModule extends QueueModule {
    constructor (options) {
      super(options);
    }
  };

  const myModule = new MyModule(OPTIONS);
  myModule.run();
});
