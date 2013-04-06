'use strict';

angular.module('firebase', []).value('Firebase', Firebase);

// Implicit syncing. angularFire binds a model to $scope and keeps the dat
// synchronized with a Firebase location both ways.
// TODO: Optimize to use child events instead of whole 'value'.
angular.module('firebase').factory('angularFire', function($q) {
  return function(url, scope, name, ret) {
    var af = new AngularFire($q, url);
    return af.associate(scope, name, ret);
  };
});

function AngularFire($q, url) {
  this._q = $q;
  this._initial = true;
  this._remoteValue = false;
  this._fRef = new Firebase(url);
}
AngularFire.prototype = {
  associate: function($scope, name, ret) {
    var self = this;
    if (!ret) {
      ret = [];
    }
    var deferred = this._q.defer();
    this._fRef.on('value', function(snap) {
      var resolve = false;
      if (deferred) {
        resolve = deferred;
        deferred = false;
      }
      self._remoteValue = ret;
      if (snap && snap.val()) {
        var val = snap.val();
        if (typeof val != typeof ret) {
          self._fRef.set(null);
          return;
        }
        // Also distinguish between objects and arrays.
        var check = Object.prototype.toString;
        if (check.call(ret) != check.call(val)) {
          self._fRef.set(null);
          return;
        }
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
    $scope[name] = angular.copy(val);
    this._remoteValue = angular.copy(val);
    if (deferred) {
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

// Explicit syncing. Provides a collection object you can modify.
// Original code by @petebacondarwin, from:
// https://github.com/petebacondarwin/angular-firebase/blob/master/ng-firebase-collection.js
angular.module('firebase').factory('angularFireCollection', function($timeout) {
  function angularFireItem(ref, index) {
    this.$ref = ref.ref();
    this.$id = ref.name();
    this.$index = index;
    angular.extend(this, ref.val());
  }

  return function(collectionUrl, initialCb) {
    var collection = [];
    var indexes = {};
    var collectionRef = new Firebase(collectionUrl);

    function getIndex(prevId) {
      return prevId ? indexes[prevId] + 1 : 0;
    }
    
    function addChild(index, item) {
      indexes[item.$id] = index;
      collection.splice(index, 0, item);
    }

    function removeChild(id) {
      var index = indexes[id];
      // Remove the item from the collection.
      collection.splice(index, 1);
      indexes[id] = undefined;
    }

    function updateChild (index, item) {
      collection[index] = item;
    }

    function moveChild (from, to, item) {
      collection.splice(from, 1);
      collection.splice(to, 0, item);
      updateIndexes(from, to);
    }

    function updateIndexes(from, to) {
      var length = collection.length;
      to = to || length;
      if (to > length) {
        to = length;
      }
      for (var index = from; index < to; index++) {
        var item = collection[index];
        item.$index = indexes[item.$id] = index;
      }
    }

    if (initialCb && typeof initialCb == 'function') {
      collectionRef.once('value', initialCb);
    }

    collectionRef.on('child_added', function(data, prevId) {
      $timeout(function() {
        var index = getIndex(prevId);
        addChild(index, new angularFireItem(data, index));
        updateIndexes(index);
      });
    });

    collectionRef.on('child_removed', function(data) {
      $timeout(function() {
        var id = data.name();
        removeChild(id);
        updateIndexes(indexes[id]);
      });
    });

    collectionRef.on('child_changed', function(data, prevId) {
      $timeout(function() {
        var index = indexes[data.name()];
        var newIndex = getIndex(prevId);
        var item = new angularFireItem(data, index);
        
        updateChild(index, item);
        if (newIndex !== index) {
          moveChild(index, newIndex, item);
        }
      });
    });

    collectionRef.on('child_moved', function(ref, prevId) {
      $timeout(function() {
        var oldIndex = indexes[ref.name()];
        var newIndex = getIndex(prevId);
        var item = collection[oldIndex];
        moveChild(oldIndex, newIndex, item);
      });
    });

    collection.add = function(item, cb) {
      collectionRef.push(item, cb ? cb : null);
    };
    collection.remove = function(itemOrId) {
      var item = angular.isString(itemOrId) ? collection[itemOrId] : itemOrId;
      item.$ref.remove();
    };

    collection.update = function(itemOrId) {
      var item = angular.isString(itemOrId) ? collection[itemOrId] : itemOrId;
      var copy = {};
      angular.forEach(item, function(value, key) {
        if (key.indexOf('$') !== 0) {
          copy[key] = value;
        }
      });
      item.$ref.set(copy);
    };

    return collection;
  };
});
