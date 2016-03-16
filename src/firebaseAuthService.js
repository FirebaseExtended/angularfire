(function() {
  "use strict";

  function FirebaseAuthService($firebaseAuth, $firebaseRef) {
    return $firebaseAuth($firebaseRef.default);
  }
  FirebaseAuthService.$inject = ['$firebaseAuth', '$firebaseRef'];

  angular.module('firebase')
    .factory('$firebaseAuthService', FirebaseAuthService);

})();
