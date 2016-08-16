(function(exports) {
  "use strict";

  angular.module("firebase.utils", []);
  angular.module("firebase.config", []);
  angular.module("firebase.auth", ["firebase.utils"]);
  angular.module("firebase.database", ["firebase.utils"]);
  angular.module("firebase.storage", ["firebase.utils"]);

  // Define the `firebase` module under which all AngularFire
  // services will live.
  angular.module("firebase", [
    "firebase.utils",
    "firebase.config",
    "firebase.auth",
    "firebase.database",
    "firebase.storage"
  ])
    //TODO: use $window
    .value("Firebase", exports.firebase)
    .value("firebase", exports.firebase);
})(window);
