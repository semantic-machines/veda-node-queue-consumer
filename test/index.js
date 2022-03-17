const assert = require('assert');
const fs = require('fs');
const baretest = require('baretest');

const test1 = require('./test1.js');
const test2 = require('./test2.js');
const test3 = require('./test3.js');

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
