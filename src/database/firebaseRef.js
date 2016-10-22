(function() {
  
  "use strict";
  
  angular
    .module('firebase.database')
    .provider('$firebaseRef', FirebaseRef);
  
  function FirebaseRef() {
    
    var vm = this;
    
    vm.urls         = null;
    vm.registerUrl  = registerUrl;
    vm.$$checkUrls  = checkUrls;
    vm.$$createRefsFromUrlConfig = createMultipleRefs;
    vm.$get = FirebaseRef_$get;
    
    /**
     * Register Url
     */
    
    function registerUrl(urlOrConfig) {

      if (typeof urlOrConfig === 'string') {
        vm.urls = {};
        vm.urls.default = urlOrConfig;
      }

      if (angular.isObject(urlOrConfig)) {
        vm.urls = urlOrConfig;
      }

    };
    
    /**
     * Check Urls
     */
    
    function checkUrls(urlConfig) {
      if (!urlConfig) {
        return new Error('No Firebase URL registered. Use firebaseRefProvider.registerUrl() in the config phase. This is required if you are using $firebaseAuthService.');
      }
      if (!urlConfig.default) {
        return new Error('No default Firebase URL registered. Use firebaseRefProvider.registerUrl({ default: "https://<my-firebase-app>.firebaseio.com/"}).');
      }
    };
    
    
    /**
     * Create multiple references
     */
    
    function createMultipleRefs(urlConfig) {
      var refs = {};
      var error = vm.$$checkUrls(urlConfig);
      if (error) { throw error; }
      angular.forEach(urlConfig, function(value, key) {
        refs[key] = firebase.database().refFromURL(value);
      });
      return refs;
    };
    
    /**
     * FirebaseRef_$get
     */
    
    function FirebaseRef_$get() {
      return vm.$$createRefsFromUrlConfig(vm.urls);
    };
  }

})();
