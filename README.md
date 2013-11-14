AngularFire
===========
AngularFire is an officially supported [AngularJS](http://angularjs.org/) binding
for [Firebase](http://www.firebase.com/?utm_medium=web&utm_source=angularFire).
Firebase is a full backend so you don't need servers to build your Angular app!

*Please visit [AngularFire.com](http://angularfire.com) for a
[tutorial](http://angularfire.com/tutorial),
[a quickstart guide](http://angularfire.com/quickstart.html),
[documentation](http://angularfire.com/documentation.html) and more!*

Join our [Firebase + Angular Google Group](https://groups.google.com/forum/#!forum/firebase-angular) to ask questions, provide feedback, and share apps you've built with Firebase and Angular.

Development
-----------
[![Build Status](https://travis-ci.org/firebase/angularFire.png)](https://travis-ci.org/firebase/angularFire)

If you'd like to hack on AngularFire itself, you'll need
[node.js](http://nodejs.org/download/) and
[CasperJS](https://github.com/n1k0/casperjs):

```bash
brew install casperjs
npm install
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

License
-------
[MIT](http://firebase.mit-license.org).
