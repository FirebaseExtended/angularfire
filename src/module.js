(function(exports) {
  "use strict";

  // Define the `firebase` module under which all AngularFire
  // services will live.
  angular.module("firebase", [])
    //TODO: use $window
    .value("Firebase", exports.Firebase);

  angular.module("firebase.utils", []);
  angular.module("firebase.config", []);
  angular.module("firebase.auth", ["firebase.utils"]);
  angular.module("firebase.database", ["firebase.utils"]);
})(window);
