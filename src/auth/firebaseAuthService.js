(function() {
  "use strict";

  function FirebaseAuthService($firebaseAuth) {
    return $firebaseAuth();
  }
  FirebaseAuthService.$inject = ['$firebaseAuth'];

  angular.module('angularfire.auth')
    .factory('$firebaseAuthService', FirebaseAuthService);

})();
