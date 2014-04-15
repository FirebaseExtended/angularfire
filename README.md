AngularFire
===========
AngularFire is an officially supported [AngularJS](http://angularjs.org/) binding
for [Firebase](http://www.firebase.com/?utm_medium=web&utm_source=angularFire).
Firebase is a full backend so you don't need servers to build your Angular app!

*Please visit the
[Firebase + Angular Quickstart guide](https://www.firebase.com/quickstart/angularjs.html)
for more information*.

We also have a [tutorial](https://www.firebase.com/tutorial/#tutorial/angular/0),
[documentation](https://www.firebase.com/docs/angular/index.html) and an
[API reference](https://www.firebase.com/docs/angular/reference.html).

Join our [Firebase + Angular Google Group](https://groups.google.com/forum/#!forum/firebase-angular) to ask questions, provide feedback, and share apps you've built with Firebase and Angular.

Development
-----------
[![Build Status](https://travis-ci.org/firebase/angularFire.png)](https://travis-ci.org/firebase/angularFire)
[![Bower version](https://badge.fury.io/bo/angularfire.png)](http://badge.fury.io/bo/angularfire)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

If you'd like to hack on AngularFire itself, you'll need
[node.js](http://nodejs.org/download/), [Bower](http://bower.io), and
[CasperJS](https://github.com/n1k0/casperjs).

You can also start hacking on AngularFire in a matter of seconds on
[Nitrous.IO](https://www.nitrous.io/?utm_source=github.com&utm_campaign=angularFire&utm_medium=hackonnitrous)

[![Hack firebase/angularFire on
Nitrous.IO](https://d3o0mnbgv6k92a.cloudfront.net/assets/hack-l-v1-3cc067e71372f6045e1949af9d96095b.png)](https://www.nitrous.io/hack_button?source=embed&runtime=nodejs&repo=firebase%2FangularFire&file_to_open=README.md)

```bash
npm install -g phantomjs casperjs
npm install
bower install
```

Use grunt to build and test the code:

```bash
# Default task - validates with jshint, minifies source and then runs unit tests
grunt

# Watch for changes and run unit test after each change
grunt watch

# Run tests
grunt test

# Minify source
grunt build
```

In addition to the automated test suite, there is an additional manual test suite that ensures that the
$firebaseSimpleLogin service is working properly with auth providers. These tests are run using karma with the following command:

```bash
karma start tests/manual_karma.conf.js
```

Note that you must click "Close this window", login to Twitter, etc. when
prompted in order for these tests to complete successfully.

License
-------
[MIT](http://firebase.mit-license.org).
