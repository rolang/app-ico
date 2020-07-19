'use strict';

const fs = require('fs-extra');
const cacheRootDir = '.favicon-cache';
const https = require('https');
const path = require('path');

function post(config, errCallback, callback) {
  const postData = JSON.stringify(config);
  const req = https.request({
    hostname: 'realfavicongenerator.net',
    method: 'POST',
    path: '/api/favicon',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        callback(res, json);
      } catch (e) {
        errCallback(e)
      }
    });
  });

  req.on('error', errCallback);
  req.write(postData);
  req.end();
}

module.exports = (config) => new Promise((resolve, reject) => {
  const crypto = require('crypto');
  const createPost = require('rfg-config').createPost;
  const requestData = createPost(config.src, config.options);
  const requestFingerprint = crypto.createHash('md5').update(JSON.stringify(requestData)).digest('hex');
  const cacheDirPath = path.resolve(cacheRootDir, requestFingerprint);
  const cachedFilesDir = path.join(cacheDirPath, 'files');
  const cachedHtmlFile = path.join(cacheDirPath, 'favicons.html');
  const cachedResponseFile = path.join(cacheDirPath, 'response.json');

  fs.pathExists(cacheDirPath, (err, cached) => {
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
        fs.copySync(cachedFilesDir, config.output.files);
      }

      if (config.output.response) {
        fs.copySync(cachedResponseFile, config.output.response);
      }

      if (config.output.html) {
        fs.copySync(cachedHtmlFile, config.output.html);
      }

      resolve({response: result, fromCache: true});
    } else {
      post(requestData, reject, (response, data) => {
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
        const tasks = []
        tasks.push(fs.outputFile(cachedResponseFile, responseStr));

        if (config.output.files) {
          tasks.push(downloadPkg(result.favicon.package_url, config.output.files, cachedFilesDir));
        }

        if (config.output.response) {
          tasks.push(fs.outputFile(config.output.response, responseStr));
        }

        if (config.output.html) {
          tasks.push(fs.outputFile(config.output.html, result.favicon.html_code));
          tasks.push(fs.outputFile(cachedHtmlFile, result.favicon.html_code));
        }

        Promise.all(tasks).then(() => resolve({response: result, fromCache: false}), reject);
      });
    }
  });
});

module.exports.downloadPkg = downloadPkg;
module.exports.removeCache = () => fs.removeSync(cacheRootDir);

function downloadPkg (url, dest, cacheDir) {
  const extract = require('extract-zip');

  return new Promise((resolve, reject) => {
    https.get(url, response => {
      const zipPath = path.join(dest, "result.zip");
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
      fs.mkdirpSync(dest);
      
      response.pipe(fs.createWriteStream(zipPath))
      .on('error', reject)
      .on('finish', () => {
        extract(zipPath, { dir: path.resolve(dest) })
        .then(() => {
          if (cacheDir) {
            fs.unlink(zipPath).then(fs.copy(dest, cacheDir)).then(resolve, reject);
          } else {
            fs.unlink(zipPath).then(resolve, reject);
          }
        }, reject)
      })
    }).on('error', reject);
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
