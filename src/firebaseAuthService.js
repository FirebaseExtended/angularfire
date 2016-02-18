(function() {
  "use strict";

  function FirebaseAuthService($firebaseAuth, firebaseRef) {
    return $firebaseAuth(firebaseRef);
  }
  FirebaseAuthService.$inject = ['$firebaseAuth', 'firebaseRef'];

  angular.module('firebase')
    .factory('$firebaseAuthService', FirebaseAuthService);

})();
