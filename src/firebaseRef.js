"use strict";

function FirebaseRefNotProvidedError() {
  this.name = 'FirebaseRefNotProvidedError';
  this.message = 'No Firebase URL registered. Use firebaseRefProvider.registerUrl() in the config phase to set up a root reference.';
  this.stack = (new Error()).stack;
}
FirebaseRefNotProvidedError.prototype = Object.create(Error.prototype);
FirebaseRefNotProvidedError.prototype.constructor = FirebaseRefNotProvidedError;

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
      return new FirebaseRefNotProvidedError();
    }
  };

  this.$$createRefsFromUrlConfig = function $$createMultipleRefs(urlConfig) {
    var error = this.$$checkUrls(urlConfig);
    if (error) { throw error; }
    var defaultUrl = urlConfig.default;
    var defaultRef = new Firebase(defaultUrl);
    delete urlConfig.default;
    angular.forEach(urlConfig, function(value, key) {
      if (!defaultRef.hasOwnProperty(key)) {
        defaultRef[key] = new Firebase(value);
      } else {
        throw new Error(key + ' is a reserved property name on firebaseRef.');
      }
    });
    return defaultRef;
  };

  this.$get = function FirebaseRef_$get() {
    return this.$$createRefsFromUrlConfig(this.urls);
  };
}

angular.module('firebase')
  .provider('firebaseRef', FirebaseRef);
