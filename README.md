
# AngularFire

[![Build Status](https://travis-ci.org/firebase/angularfire.svg?branch=master)](https://travis-ci.org/firebase/angularfire)
[![Coverage Status](https://img.shields.io/coveralls/firebase/angularfire.svg?branch=master&style=flat)](https://coveralls.io/r/firebase/angularfire)
[![Version](https://badge.fury.io/gh/firebase%2Fangularfire.svg)](http://badge.fury.io/gh/firebase%2Fangularfire)

AngularFire is the officially supported [AngularJS](http://angularjs.org/) binding for
[Firebase](http://www.firebase.com/?utm_medium=web&utm_source=angularfire). Firebase is a
backend service that provides data storage, authentication, and static website hosting for your Angular app.

AngularFire is a complement to the core Firebase client. It provides you with three Angular
services:
  * `$firebaseObject` - synchronized objects
  * `$firebaseArray` - synchronized collections
  * `$firebaseAuth` - authentication, user management, routing


## Downloading AngularFire

In order to use AngularFire in your project, you need to include the following files in your HTML:

```html
<!-- AngularJS -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js"></script>

<!-- Firebase -->
<script src="https://cdn.firebase.com/js/client/2.2.5/firebase.js"></script>

<!-- AngularFire -->
<script src="https://cdn.firebase.com/libs/angularfire/1.1.2/angularfire.min.js"></script>
```

Use the URL above to download both the minified and non-minified versions of AngularFire from the
Firebase CDN. You can also download them from the
[releases page of this GitHub repository](https://github.com/firebase/angularfire/releases).
[Firebase](https://www.firebase.com/docs/web/quickstart.html?utm_medium=web&utm_source=angularfire) and
[Angular](https://angularjs.org/) libraries can be downloaded directly from their respective websites.

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


## Getting Started with Firebase

AngularFire uses Firebase for data storage and authentication. You can [sign up here for a free
account](https://www.firebase.com/signup/?utm_medium=web&utm_source=angularfire).


## Documentation

The Firebase docs have a [quickstart](https://www.firebase.com/docs/web/bindings/angular/quickstart.html?utm_medium=web&utm_source=angularfire),
[guide](https://www.firebase.com/docs/web/bindings/angular/guide?utm_medium=web&utm_source=angularfire),
and [full API reference](https://www.firebase.com/docs/web/bindings/angular/api.html?utm_medium=web&utm_source=angularfire)
for AngularFire.

We also have a [tutorial](https://www.firebase.com/tutorial/#tutorial/angular/0?utm_medium=web&utm_source=angularfire)
to help you get started with AngularFire.

Join our [Firebase + Angular Google Group](https://groups.google.com/forum/#!forum/firebase-angular)
to ask questions, provide feedback, and share apps you've built with AngularFire.


## Contributing

If you'd like to contribute to AngularFire, you'll need to run the following commands to get your
environment set up:

```bash
$ git clone https://github.com/firebase/angularfire.git
$ cd angularfire            # go to the angularfire directory
$ npm install -g grunt-cli  # globally install grunt task runner
$ npm install -g bower      # globally install Bower package manager
$ npm install               # install local npm build / test dependencies
$ bower install             # install local JavaScript dependencies
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
