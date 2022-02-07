const test = require('baretest')('Veda node queue module');
const assert = require('assert');
const fs = require('fs');

require('./test1.js')(test, assert);
require('./test2.js')(test, assert);
require('./test3.js')(test, assert);

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test.before(function () {
  const path = './test/queue/';
  const regex = /test_info_pop.*$/;
  fs.readdirSync(path)
    .filter((f) => regex.test(f))
    .map((f) => fs.unlinkSync(path + f));
});

test.after(async function () {
  await timeout(100);
  process.kill(process.pid, 'SIGTERM');
});

test.run();
