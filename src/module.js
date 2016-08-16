(function(exports) {
  "use strict";

  // Define the `firebase` module under which all AngularFire
  // services will live.
  angular.module("firebase", [])
    //TODO: use $window
    .value("Firebase", exports.Firebase);

  angular.module("angularfire.utils", []);
  angular.module("angularfire.config", []);
  angular.module("angularfire.auth", ["angularfire.utils"]);
  angular.module("angularfire.database", ["angularfire.utils"]);
})(window);
