'use strict';

angular.module('firebase', []).factory('angularFire', function($q) {
  return function(url, scope, name) {
    var af = new AngularFire($q, $parse, url);
    return af.associate(scope, name);
  };
});

function AngularFire($q, $parse, url) {
  this._q = $q;
  this._parse = $parse;
  this._initial = true;
  this._remoteValue = false;
  this._fRef = new Firebase(url);
}
AngularFire.prototype = {
  associate: function($scope, name) {
    var self = this;
    var deferred = this._q.defer();
    this._fRef.on('value', function(snap) {
      var resolve = false;
      if (deferred) {
        resolve = deferred;
        deferred = false;
      }
      self._remoteValue = [];
      if (snap && snap.val()) {
        var val = snap.val();
        self._remoteValue = angular.copy(val);
        if (angular.equals(val, $scope[name])) {
          return;
        }
      }
      self._safeApply($scope,
          self._resolve.bind(self, $scope, name, resolve, self._remoteValue));
    });
    return deferred.promise;
  },
  _resolve: function($scope, name, deferred, val) {
    console.log("remote change");
    this._parse(name).assign($scope, angular.copy(val));
    this._remoteValue = angular.copy(val);
    if (deferred) {
      console.log("resolving deferred");
      deferred.resolve(val);
      this._watch($scope, name);
    }
  },
  _watch: function($scope, name) {
    // Watch for local changes.
    var self = this;
    $scope.$watch(name, function() {
      if (self._initial) {
        self._initial = false;
        return;
      }
      var val = JSON.parse(angular.toJson($scope[name]));
      if (angular.equals(val, self._remoteValue)) {
        return;
      }
      console.log("local change");
      self._fRef.set(val);
    }, true);
  },
  _safeApply: function($scope, fn) {
    var phase = $scope.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      fn();
    } else {
      $scope.$apply(fn);
    }
  }
};
