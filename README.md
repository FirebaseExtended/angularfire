# AngularFire

[![Build Status](https://travis-ci.org/firebase/angularfire.svg?branch=master)](https://travis-ci.org/firebase/angularfire)
[![Coverage Status](https://coveralls.io/repos/firebase/angularfire/badge.svg?branch=master&service=github)](https://coveralls.io/github/firebase/angularfire?branch=master)
[![Version](https://badge.fury.io/gh/firebase%2Fangularfire.svg)](http://badge.fury.io/gh/firebase%2Fangularfire)
[![Join Slack](https://img.shields.io/badge/slack-join-brightgreen.svg)](https://firebase-community.appspot.com/)


## Table of Contents

 * [Overview](#overview)
 * [Downloading AngularFire](#downloading-angularfire)
 * [Getting Started With Firebase](#getting-started-with-firebase)
 * [Documentation](#documentation)
 * [Migration Guides](#migration-guides)
 * [Contributing](#contributing)


## Overview

AngularFire is the officially supported [AngularJS](http://angularjs.org/) binding for
[Firebase](http://firebase.google.com). Firebase is a
backend service that provides data storage, authentication, and static website hosting for your
Angular app.

AngularFire is a complement to the core Firebase client. It provides you with three Angular
services:
  * `$firebaseObject` - synchronized objects
  * `$firebaseArray` - synchronized collections
  * `$firebaseAuth` - authentication, user management, routing


## Downloading AngularFire

In order to use AngularFire in your project, you need to include the following files in your HTML:

```html
<!-- AngularJS -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular.min.js"></script>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/3.0.0/firebase.js"></script>

<!-- AngularFire -->
<script src="https://cdn.firebase.com/libs/angularfire/2.0.0/angularfire.min.js"></script>
```

Use the URL above to download both the minified and non-minified versions of AngularFire from the
Firebase CDN. You can also download them from the
[releases page of this GitHub repository](https://github.com/firebase/angularfire/releases).
The [Firebase](https://firebase.google.com) and
[Angular](https://angularjs.org/) libraries can also be downloaded directly from their respective websites.

You can also install AngularFire via npm and Bower and its dependencies will be downloaded
automatically:

```bash
$ npm install angularfire --save
```

```bash
$ bower install angularfire --save
```

Once you've included AngularFire and its dependencies into your project, you will have access to
the `$firebase` service.


## Getting Started With Firebase

AngularFire uses Firebase for data storage and authentication. You can [sign up here for a free
account](https://firebase.google.com).


## Documentation

* [Quickstart](docs/quickstart.md)
* [Guide](docs/guide/README.md)
* [API reference](https://angularfire.firebaseapp.com/api.html)

Join our [Firebase + Angular Google Group](https://groups.google.com/forum/#!forum/firebase-angular)
to ask questions, provide feedback, and share apps you've built with AngularFire.


## Migration Guides

* [Migrating from AngularFire `1.x.x` to `2.x.x`](migration/1XX-to-2XX.md)
* [Migrating from AngularFire `0.9.x` to `1.x.x`](migration/09X-to-1XX.md)


## Contributing

If you'd like to contribute to AngularFire, you'll need to run the following commands to get your
environment set up:

```bash
$ git clone https://github.com/firebase/angularfire.git
$ cd angularfire            # go to the angularfire directory
$ npm install -g grunt-cli  # globally install grunt task runner
$ npm install               # install local npm build / test dependencies
$ grunt install             # install Selenium server for end-to-end tests
$ grunt watch               # watch for source file changes
```

`grunt watch` will watch for changes in the `/src/` directory and lint, concatenate, and minify the
source files when a change occurs. The output files - `angularfire.js` and `angularfire.min.js` -
are written to the `/dist/` directory. `grunt watch` will also re-run the unit tests every time you
update any source files.

You can run the entire test suite via the command line using `grunt test`. To only run the unit
tests, run `grunt test:unit`. To only run the end-to-end [Protractor](https://github.com/angular/protractor/)
tests, run `grunt test:e2e`.
