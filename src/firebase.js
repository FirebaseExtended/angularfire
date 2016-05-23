(function() {
  'use strict';

  angular.module("firebase")

    /** @deprecated */
    .factory("$firebase", function() {
      return function() {
        throw new Error('$firebase has been removed. You may instantiate $firebaseArray and $firebaseObject ' +
        'directly now. For simple write operations, just use the Firebase ref directly. ' +
        'See the AngularFire 1.0.0 migration guide for details: https://github.com/firebase/angularfire/blob/master/docs/migration/09X-to-1XX.md');
      };
    });

})();
