(function() {
  'use strict';

  angular.module("firebase")

    /** @deprecated */
    .factory("$firebase", function() {
      return function() {
        throw new Error('$firebase has been removed. You may instantiate $FirebaseArray and $FirebaseObject ' +
        'directly now. For simple write operations, just use the Firebase ref directly. ' +
        'See CHANGELOG for details and migration instructions: https://www.firebase.com/docs/web/changelog.html');
      };
    });

})();
