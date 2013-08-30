AngularFire
===========
AngularFire is an officially supported [AngularJS](http://angularjs.org/) binding
for [Firebase](http://www.firebase.com/?utm_medium=web&utm_source=angularFire).
Firebase is a full backend so you don't need servers to build your Angular app!

*Please visit [AngularFire.com](http://angularfire.com) for a
[tutorial](http://angularfire.com/tutorial),
[a quickstart guide](http://angularfire.com/quickstart.html),
[documentation](http://angularfire.com/documentation.html) and more!*

Development
-----------
[![Build Status](https://travis-ci.org/firebase/angularFire.png)](https://travis-ci.org/firebase/angularFire)

If you'd like to hack on AngularFire itself, you'll need
[UglifyJS](https://github.com/mishoo/UglifyJS2) and
[CasperJS](https://github.com/n1k0/casperjs):

```bash
npm install uglify-js -g
brew install casperjs
```

A Makefile is included for your convenience:

```bash
# Run tests
make test
# Minify source
make minify
```

License
-------
[MIT](http://firebase.mit-license.org).
