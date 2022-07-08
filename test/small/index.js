import options from './.options.js';
import assert from 'assert';
import fs from 'fs';
import baretest from 'baretest';
import log from 'loglevel';
import test1 from './test1.js'
import test2 from './test2.js';
import test3 from './test3.js';

log.setLevel(options.logLevel);

const test = baretest('Veda node queue module (small)');

test1(test, assert, log, options);
test2(test, assert, log, options);
test3(test, assert, log, options);

const path = options.path;
const regex = new RegExp(options.queue + '_info_pop.*$');
fs.readdirSync(path)
  .filter((f) => regex.test(f))
  .map((f) => fs.unlinkSync(path + f));

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test.after(async function () {
  await timeout(100);
  process.kill(process.pid, 'SIGTERM');
});

test.run();
