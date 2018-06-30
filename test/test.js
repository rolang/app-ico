#! /usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const config = require('./appico.config');
const assert = require('assert');
const appIcon = require('../');

appIcon.removeCache();

// two runs with and without cache
testRun(false, () => testRun(true));

function testRun (expectedFromCache, callback) {
  fs.removeSync(config.output.files);

  appIcon(config).then(result => {
    assert(expectedFromCache === result.fromCache, 'Cache usage as expected');
    assert(typeof result.response === 'object' && result.response.hasOwnProperty('favicon'), 'Result object is returned');

    // NOTE: for some reason the last file (yandex-browser-manifest.json) couldn't be found without the timeout
    setTimeout(() => {
      // check some files for existence
      [
        'apple-touch-icon.png',
        'android-chrome-36x36.png',
        'coast-228x228.png',
        'mstile-70x70.png',
        'yandex-browser-50x50.png',
        'favicon.ico',
        'favicons.html',
        'favicons.json',
        'browserconfig.xml',
        'yandex-browser-50x50.png',
        'mstile-310x310.png',
        'yandex-browser-manifest.json'
      ].forEach(fileName => {
        const filePath = path.join(config.output.files, fileName);
        assert(fs.existsSync(filePath), `Ensure ${filePath} exists`);
      });

      console.info('Test by ' + (!expectedFromCache ? 'not ' : '') + 'using the cache successful!');

      if (typeof callback === 'function') {
        callback();
      }
    }, 10);
  }, err => {
    console.error(err);
    process.exit(1);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
