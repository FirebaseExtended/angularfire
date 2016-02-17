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
  this.singleUrl = false;
  this.registerUrl = function registerUrl(urlOrConfig) {

    if (typeof urlOrConfig === 'string') {
      this.urls = {};
      this.urls.default = urlOrConfig;
      this.singleUrl = true;
    }

    if (angular.isObject(urlOrConfig)) {
      this.urls = urlOrConfig;
      this.singleUrl = false;
    }

  };

  this.$$checkUrls = function $$checkUrls(urlConfig) {
    if (!urlConfig) {
      return new FirebaseRefNotProvidedError();
    }
  };

  this.$$createSingleRef = function $$createSingleRef(defaultUrl) {
    var error = this.$$checkUrls(defaultUrl);
    if (error) { throw error; }
    return new Firebase(defaultUrl);
  };

  this.$$createMultipleRefs = function $$createMultipleRefs(urlConfig) {
    var error = this.$$checkUrls(urlConfig);
    if (error) { throw error; }
    var defaultUrl = urlConfig.default;
    var defaultRef = new Firebase(defaultUrl);
    delete urlConfig.default;
    angular.forEach(urlConfig, function(value) {
      if (!defaultRef.hasOwnProperty(value)) {
        defaultRef[value] = new Firebase(value);
      } else {
        throw new Error(value + ' is a reserved property name on firebaseRef.');
      }
    });
    return defaultRef;
  };

  this.$get = function FirebaseRef_$get() {

    if (this.singleUrl) {
      return this.$$createSingleRef(this.urls.default);
    } else {
      return this.$$createMultipleRefs(this.urls);
    }

  };
}

angular.module('firebase')
  .provider('firebaseRef', FirebaseRef);
