(function() {
  'use strict';

  angular.module("firebase")

    /** @deprecated */
    .factory("$firebase", function() {
      return function() {
        throw new Error('$firebase has been removed. You may instantiate $FirebaseArray and $FirebaseObject ' +
        'directly now. For simple write operations, just use the Firebase ref directly. ' +
        'See the AngularFire 1.0.0 changelog for details: https://www.firebase.com/docs/web/changelog.html');
      };
    });

})();
