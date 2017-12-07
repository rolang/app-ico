#! /usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const config = require('./appico.config');
const assert = require('assert');

fs.remove(config.output.files, err => {
  if (err) {
    throw err;
  }

  require('../')(config).then(result => {
    assert(typeof result === 'object' && result.hasOwnProperty('favicon'), 'Result object is returned');

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
        'manifest.json',
        'browserconfig.xml',
        'yandex-browser-50x50.png',
        'mstile-310x310.png',
        'yandex-browser-manifest.json'
      ].forEach(fileName => {
        const filePath = path.join(config.output.files, fileName);
        console.log(`Ensure ${filePath} exists`);
        assert(fs.existsSync(filePath), `Ensure ${filePath} exists`);
      });

      console.info('Test successful!');
    }, 10);

  }, err => {
    console.error(err);
    process.exit(1);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
});
