'use strict';

const fs = require('fs-extra');

module.exports = (config) => new Promise((resolve, reject) => {
  const Client = require('node-rest-client').Client;
  const client = new Client();
  const createPost = require('rfg-config').createPost;
  const requestData = createPost(config.src, config.options);

  client.post("https://realfavicongenerator.net/api/favicon", {
    data: requestData,
    headers: { 'Content-Type': 'application/json' }
  }, (data, response) => {
    if (response.statusCode !== 200) {
      reject(rfgError(data));
    }

    const result = data.favicon_generation_result;
    const tasks = [];

    if (!config.output) {
      resolve(result);
      return;
    }

    if (config.output.files) {
      tasks.push(downloadPkg(result.favicon.package_url, config.output.files));
    }

    if (config.output.response) {
      tasks.push(promiseOut(config.output.response, JSON.stringify(result)));
    }

    if (config.output.html) {
      tasks.push(promiseOut(config.output.html, result.favicon.html_code));
    }

    Promise.all(tasks).then(() => resolve(result), reject);
  });
});

module.exports.downloadPkg = downloadPkg;

function downloadPkg (url, dest) {
  const https = require('https');
  const unzipper = require('unzipper');

  return new Promise((resolve, reject) => {
    https.get(url, response => {
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

function rfgError (data) {
  return (data &&
    data.favicon_generation_result &&
    data.favicon_generation_result.result &&
    data.favicon_generation_result.result.error_message)
    ? data.favicon_generation_result.result.error_message
    : data;
}