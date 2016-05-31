# AngularFire [![Build Status](https://travis-ci.org/firebase/angularfire.svg?branch=master)](https://travis-ci.org/firebase/angularfire) [![Coverage Status](https://coveralls.io/repos/firebase/angularfire/badge.svg?branch=master&service=github)](https://coveralls.io/github/firebase/angularfire?branch=master) [![Version](https://badge.fury.io/gh/firebase%2Fangularfire.svg)](http://badge.fury.io/gh/firebase%2Fangularfire)


AngularFire is the officially supported [AngularJS](https://angularjs.org/) binding for
[Firebase](https://firebase.google.com/). Firebase is a
backend service that provides data storage, authentication, and static website hosting for your
Angular app.

AngularFire is a complement to the core Firebase client. It provides you with three Angular
services:
  * `$firebaseObject` - synchronized objects
  * `$firebaseArray` - synchronized collections
  * `$firebaseAuth` - authentication, user management, routing

Join our [Firebase + Angular Google Group](https://groups.google.com/forum/#!forum/firebase-angular)
to ask questions, provide feedback, and share apps you've built with AngularFire.


## Table of Contents

 * [Getting Started With Firebase](#getting-started-with-firebase)
 * [Downloading AngularFire](#downloading-angularfire)
 * [Documentation](#documentation)
 * [Examples](#examples)
 * [Migration Guides](#migration-guides)
 * [Contributing](#contributing)


## Getting Started With Firebase

AngularFire requires [Firebase](https://firebase.google.com/) in order to authenticate users and sync
and store data. Firebase is a suite of integrated products designed to help you develop your app,
grow your user base, and earn money. You can [sign up here for a free account](https://console.firebase.google.com/).


## Downloading AngularFire

In order to use AngularFire in your project, you need to include the following files in your HTML:

```html
<!-- AngularJS -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular.min.js"></script>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/3.0.3/firebase.js"></script>

<!-- AngularFire -->
<script src="https://cdn.firebase.com/libs/angularfire/2.0.0/angularfire.min.js"></script>
```

You can also install AngularFire via npm and Bower and its dependencies will be downloaded
automatically:

```bash
$ npm install angularfire --save
```

```bash
$ bower install angularfire --save
```


## Documentation

* [Quickstart](docs/quickstart.md)
* [Guide](docs/guide/README.md)
* [API Reference](https://angularfire.firebaseapp.com/api.html)


## Examples

### Full Examples

* [Wait And Eat](https://github.com/gordonmzhu/angular-course-demo-app-v2)
* [TodoMVC](https://github.com/tastejs/todomvc/tree/master/examples/firebase-angular)
* [Tic-Tac-Tic-Tac-Toe](https://github.com/jwngr/tic-tac-tic-tac-toe/)
* [Firereader](http://github.com/firebase/firereader)
* [Firepoker](https://github.com/Wizehive/Firepoker)

### Recipes

* [Date Object To A Firebase Timestamp Using `$extend`](http://jsfiddle.net/katowulf/syuzw9k1/)
* [Filter a `$FirebaseArray`](http://jsfiddle.net/firebase/ku8uL0pr/)


## Migration Guides

* [Migrating from AngularFire `1.x.x` to `2.x.x`](docs/migration/1XX-to-2XX.md)
* [Migrating from AngularFire `0.9.x` to `1.x.x`](docs/migration/09X-to-1XX.md)


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
