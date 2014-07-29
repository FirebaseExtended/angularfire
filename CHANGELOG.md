v0.8.0
-------------
Release Date: 2014-07-29

  * NOTE: this release introduces several breaking changes as we works towards a stable 1.0.0 release.
  * Moved many roles of $firebase into $FirebaseObject. $firebase is now just an Angular array wrapper around the base Firebase API.
  * Introduced $FirebaseArray to provide better array support.
  * Added support for extending the base $FirebaseObject and $FirebaseArray factories.