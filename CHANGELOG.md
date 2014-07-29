v0.8.0
-------------
Release Date: 2014-07-29

  * NOTE: this release introduces several breaking changes as we works towards a stable 1.0.0 release.
  * The `$firebase` object is now a utility for obtaining sychronized objects and for calling write operations
  * Moved all read ops out of `$firebase` (use $asObject for same functionality)
  * Introduced synchronized arrays for handling collections!
  * Added support for extending the prototype of synchronized objects and arrays.
  * Renamed $bind to $bindTo (now exists on $FirebaseObject)
  * Removed $on and $child (should be able to use the `$extendFactory` methods for this functionality)
  * New enhanced docs and guides on Firebase.com!
