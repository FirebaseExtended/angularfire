(function() {
  'use strict';

  angular.module("firebase")

    /** @deprecated */
    .factory("$firebase", function() {
      return function() {
        //TODO: Update this error to speak about new module stuff
        throw new Error('$firebase has been removed. You may instantiate $firebaseArray and $firebaseObject ' +
        'directly now. For simple write operations, just use the Firebase ref directly. ' +
        'See the AngularFire 1.0.0 changelog for details: https://github.com/firebase/angularfire/releases/tag/v1.0.0');
      };
    });

})();
