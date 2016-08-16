(function() {
  "use strict";

  function FirebaseRef() {
    this.urls = null;
    this.registerUrl = function registerUrl(urlOrConfig) {

      if (typeof urlOrConfig === 'string') {
        this.urls = {};
        this.urls.default = urlOrConfig;
      }

      if (angular.isObject(urlOrConfig)) {
        this.urls = urlOrConfig;
      }

    };

    this.$$checkUrls = function $$checkUrls(urlConfig) {
      if (!urlConfig) {
        return new Error('No Firebase URL registered. Use firebaseRefProvider.registerUrl() in the config phase. This is required if you are using $firebaseAuthService.');
      }
      if (!urlConfig.default) {
        return new Error('No default Firebase URL registered. Use firebaseRefProvider.registerUrl({ default: "https://<my-firebase-app>.firebaseio.com/"}).');
      }
    };

    this.$$createRefsFromUrlConfig = function $$createMultipleRefs(urlConfig) {
      var refs = {};
      var error = this.$$checkUrls(urlConfig);
      if (error) { throw error; }
      angular.forEach(urlConfig, function(value, key) {
        refs[key] = firebase.database().refFromURL(value);
      });
      return refs;
    };

    this.$get = function FirebaseRef_$get() {
      return this.$$createRefsFromUrlConfig(this.urls);
    };
  }

  angular.module('firebase.database')
    .provider('$firebaseRef', FirebaseRef);

})();
