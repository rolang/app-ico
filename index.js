'use strict';

const fs = require('fs-extra');
const cacheRootDir = '.favicon-cache';

module.exports = (config) => new Promise((resolve, reject) => {
  const crypto = require('crypto');
  const path = require('path');
  const Client = require('node-rest-client').Client;
  const client = new Client();
  const createPost = require('rfg-config').createPost;
  const requestData = createPost(config.src, config.options);
  const requestFingerprint = crypto.createHash('md5').update(JSON.stringify(requestData)).digest('hex');
  const cacheDirPath = path.resolve(cacheRootDir, requestFingerprint);
  const cachedFilesDir = path.join(cacheDirPath, 'files');
  const cachedHtmlFile = path.join(cacheDirPath, 'favicons.html');
  const cachedResponseFile = path.join(cacheDirPath, 'response.json');

  fs.pathExists(cacheDirPath, (err, cached) => {
    const tasks = [];

    // copy from cache
    if (cached) {
      let result;

      try {
        result = JSON.parse(fs.readFileSync(cachedResponseFile));
      } catch (e) {
        reject(e);
        return;
      }

      if (config.output.files) {
        tasks.push(promiseCopy(cachedFilesDir, config.output.files));
      }

      if (config.output.response) {
        tasks.push(promiseCopy(cachedResponseFile, config.output.response));
      }

      if (config.output.html) {
        tasks.push(promiseCopy(cachedHtmlFile, config.output.html));
      }

      Promise.all(tasks).then(() => resolve({response: result, fromCache: true}), reject);
    } else {
      client.post("https://realfavicongenerator.net/api/favicon", {
        data: requestData,
        headers: { 'Content-Type': 'application/json' }
      }, (data, response) => {
        if (response.statusCode !== 200) {
          reject(rfgError(data));
        }

        const result = data.favicon_generation_result;

        if (!config.output) {
          resolve(result);
          return;
        }

        // cache result json
        const responseStr = JSON.stringify(result);
        tasks.push(promiseOut(cachedResponseFile, responseStr));

        if (config.output.files) {
          tasks.push(downloadPkg(result.favicon.package_url, config.output.files, cachedFilesDir));
        }

        if (config.output.response) {
          tasks.push(promiseOut(config.output.response, responseStr));
        }

        if (config.output.html) {
          tasks.push(promiseOut(config.output.html, result.favicon.html_code));
          tasks.push(promiseOut(cachedHtmlFile, result.favicon.html_code));
        }

        Promise.all(tasks).then(() => resolve({response: result, fromCache: false}), reject);
      });
    }
  });
});

module.exports.downloadPkg = downloadPkg;
module.exports.removeCache = () => fs.removeSync(cacheRootDir);

function downloadPkg (url, dest, cacheDir) {
  const https = require('https');
  const unzipper = require('unzipper');

  return new Promise((resolve, reject) => {
    https.get(url, response => {
      if (cacheDir) {
        response.pipe(unzipper.Extract({ path: cacheDir }))
      }

      response
        .pipe(unzipper.Extract({ path: dest }))
        .on('finish', resolve)
        .on('error', reject);
    })
      .on('error', reject);
  });
}

function promiseOut (dest, content) {
  return new Promise((resolve, reject) => {
    fs.outputFile(dest, content, err => err ? reject(err) : resolve());
  });
}

function promiseCopy (content, dest) {
  return new Promise((resolve, reject) => {
    fs.copy(content, dest, err => err ? reject(err) : resolve());
  });
}

function rfgError (data) {
  return (data &&
    data.favicon_generation_result &&
    data.favicon_generation_result.result &&
    data.favicon_generation_result.result.error_message)
    ? data.favicon_generation_result.result.error_message
    : data;
}
