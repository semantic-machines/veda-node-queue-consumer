import assert from 'assert';
import fs from 'fs';
import baretest from 'baretest';

import test1 from './test1.js'
import test2 from './test2.js';
import test3 from './test3.js';

const test = baretest('Veda node queue module');

test1(test, assert);
test2(test, assert);
test3(test, assert);

test.before(function () {
  const path = './test/queue/';
  const regex = /test_info_pop.*$/;
  fs.readdirSync(path)
    .filter((f) => regex.test(f))
    .map((f) => fs.unlinkSync(path + f));
});

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test.after(async function () {
  await timeout(100);
  process.kill(process.pid, 'SIGTERM');
});

test.run();
