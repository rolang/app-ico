'use strict';

const argv = process.argv;
const path = require('path');
const confArgIndex = argv.indexOf('-c');
let config = {};

if (argv.indexOf('cleanup') > -1) {
  require('./').removeCache();
  console.info('Favicon cache cleared.');
  return;
}

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

require('./')(config).catch(err => {
  console.error(err);
  process.exit(1);
});
