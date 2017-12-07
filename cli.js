'use strict';

const argv = process.argv;
const path = require('path');
const confArgIndex = argv.indexOf('-c');
let config = {};

try {
  if (confArgIndex > -1) {
    config = require(path.resolve(argv[confArgIndex + 1]));
  } else {
    config = require('./appico.config.js');
  }
} catch (e) {
  console.error('Could not find a configuration file.');
  throw e;
}

require('./')(config);
