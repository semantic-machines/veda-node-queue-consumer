import options from './.options.js';
import assert from 'assert';
import fs from 'fs';
import baretest from 'baretest';
import log from 'loglevel';
import test1 from './test1.js'
import test2 from './test2.js';

log.setLevel(options.logLevel);

const test = baretest('Veda node queue module (big)');

const total1 = test1(test, assert, log, options);
const total2 = test2(test, assert, log, options);

const path = options.path;
const regex = new RegExp(options.queue + '_info_pop.*$');
fs.readdirSync(path)
  .filter((f) => regex.test(f))
  .map((f) => fs.unlinkSync(path + f));

test.run();

assert(total1 === total2);
