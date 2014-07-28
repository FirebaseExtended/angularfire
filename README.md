
# AngularFire

[![Build Status](https://travis-ci.org/firebase/angularfire.svg)](https://travis-ci.org/firebase/angularfire)
[![Version](https://badge.fury.io/gh/firebase%2Fangularfire.svg)](http://badge.fury.io/gh/firebase%2Fangularfire)

AngularFire is the officially supported [AngularJS](http://angularjs.org/) binding
for [Firebase](http://www.firebase.com/?utm_medium=web&utm_source=angularfire).
Firebase is a full backend so you don't need servers to build your Angular app. AngularFire provides you with the `$firebase` service which allows you to easily keep your `$scope` variables in sync with your Firebase backend.

## Downloading AngularFire

In order to use AngularFire in your project, you need to include the following files in your HTML:

```html
<!-- AngularJS -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.0-beta.17/angular.min.js"></script>

<!-- Firebase -->
<script src="https://cdn.firebase.com/js/client/1.0.18/firebase.js"></script>

<!-- AngularFire -->
<script src="https://cdn.firebase.com/libs/angularfire/0.8.0/angularfire.min.js"></script>
```

Use the URL above to download both the minified and non-minified versions of AngularFire from the Firebase CDN. You can also download them from the root of this GitHub repository. [Firebase](https://www.firebase.com/docs/web-quickstart.html?utm_medium=web&utm_source=angularfire) and [AngularJS](http://angularjs.org/) can be downloaded directly from their respective websites.

You can also install AngularFire via Bower and the dependencies will be downloaded automatically:

```bash
$ bower install angularfire --save
```

Once you've included AngularFire and its dependencies into your project, you will have access to the `$firebase` service.

You can also start hacking on AngularFire in a matter of seconds on
[Nitrous.IO](https://www.nitrous.io/?utm_source=github.com&utm_campaign=angularfire&utm_medium=hackonnitrous):

[![Hack firebase/angularfire on
Nitrous.IO](https://d3o0mnbgv6k92a.cloudfront.net/assets/hack-l-v1-3cc067e71372f6045e1949af9d96095b.png)](https://www.nitrous.io/hack_button?source=embed&runtime=nodejs&repo=firebase%2Fangularfire&file_to_open=README.md)

## Getting Started with Firebase

AngularFire requires Firebase in order to sync data. You can [sign up here](https://www.firebase.com/docs/web-quickstart.html?utm_medium=web&utm_source=angularfire) for a free account.

## Documentation

The Firebase docs have a [quickstart](https://www.firebase.com/docs/web/bindings/angular/quickstart.html), [guide](https://www.firebase.com/docs/web/bindings/angular/guide.html), and [full API reference](https://www.firebase.com/docs/web/bindings/angular/api.html) for AngularFire.

We also have a [tutorial](https://www.firebase.com/tutorial/#tutorial/angular/0) to help you get started with AngularFire.

Join our [Firebase + Angular Google Group](https://groups.google.com/forum/#!forum/firebase-angular) to ask questions, provide feedback, and share apps you've built with Firebase and Angular.

## Contributing

If you'd like to contribute to AngularFire, you'll need to run the following commands to get your environment set up:

```bash
$ git clone https://github.com/firebase/angularfire.git
$ cd angularfire        # go to the angularfire directory
$ npm install -g grunt  # globally install grunt task runner
$ npm install -g bower  # globally install Bower package manager
$ npm install           # install local npm build / test dependencies
$ bower install         # install local JavaScript dependencies
$ grunt install         # install Selenium server for end-to-end tests
$ grunt watch           # watch for source file changes
```

`grunt watch` will watch for changes in the `/src/` directory and lint, concatenate, and minify the source files when a change occurs. The output files - `angularfire.js` and `angularfire.min.js` - are written to the `/dist/` directory. `grunt watch` will also re-run the unit tests every time you update any source files.

You can run the entire test suite via the command line using `grunt test`. To only run the unit tests, run `grunt test:unit`. To only run the end-to-end [Protractor](https://github.com/angular/protractor/) tests, run `grunt test:e2e`.

In addition to the automated test suite, there is an additional manual test suite that ensures that the `$firebaseSimpleLogin` service is working properly with the authentication providers. These tests can be run with `grunt test:manual`. Note that you must click "Close this window", login to Twitter, etc. when prompted in order for these tests to complete successfully.
