(function() {
  "use strict";

  function FirebaseAuthService($firebaseAuth, $firebaseRef) {
    return $firebaseAuth();
  }
  FirebaseAuthService.$inject = ['$firebaseAuth', '$firebaseRef'];

  angular.module('firebase')
    .factory('$firebaseAuthService', FirebaseAuthService);

})();
