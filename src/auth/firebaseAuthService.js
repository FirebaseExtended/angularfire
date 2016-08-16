(function() {
  "use strict";

  function FirebaseAuthService($firebaseAuth) {
    return $firebaseAuth();
  }
  FirebaseAuthService.$inject = ['$firebaseAuth'];

  angular.module('firebase.auth')
    .factory('$firebaseAuthService', FirebaseAuthService);

})();
