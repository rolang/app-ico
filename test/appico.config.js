const path = require('path');
const pkg = require('../package');
const distDir = path.join('test', 'icons');
const defaultOpts = require('rfg-config').defaultConf;

module.exports = {
  src: path.join('test', 'logo.png'),
  options: Object.assign(defaultOpts, {
    path: '/test/icons',
    appName: pkg.name,
    appDescription: pkg.description,
    version: pkg.version
  }),
  output: {
    files: distDir,
    html: path.join(distDir, 'favicons.html'),
    response: path.join(distDir, 'favicons.json')
  }
};
