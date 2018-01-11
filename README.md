# app-ico
 - Favicon files generator using the [RealFaviconGenerator API](https://realfavicongenerator.net/) and simplified [configuration](https://github.com/Rommeo85/rfg-config).
 - Provides Node API and CLI

[![npm Package](https://img.shields.io/npm/v/app-ico.svg?style=flat-square)](https://www.npmjs.org/package/app-ico) 
[![Build Status](https://travis-ci.org/rommeo85/app-ico.svg)](https://travis-ci.org/Rommeo85/app-ico)
 
### Usage
Create a configuration js file like `appico.config.js` (see [example](https://github.com/Rommeo85/app-ico/blob/master/test/appico.config.js) and [configuration readme](https://github.com/Rommeo85/rfg-config#readme)).

### Usage Node API
```js
let config = require('./appico.config');
let createIcons = require('app-ico');

createIcons(config).then(result => {
  // "result.response" contains the response data from the RealFaviconGenerator API
  
  // if config.output[files|html|response] is set, files will be written in the directory
});
```

### Usage CLI
 - `app-ico` Will look for appico.config.js in the root directory by default.
 - `app-ico -c config/favicon.config` will look for config/appico.config.js
 - in package.json e. g.:
    ````json
    {
        "scripts": {
          "favicons": "app-ico -c config/favicon.config"
        }
    }
    ````
