"use strict";

angular.module("firebase", []).value("Firebase", Firebase);

// Implicit syncing. angularFire binds a model to $scope and keeps the data
// synchronized with a Firebase location both ways.
// TODO: Optimize to use child events instead of whole "value".
angular.module("firebase").factory("angularFire", ["$q", "$parse", "$timeout",
  function($q, $parse, $timeout) {
    return function(ref, scope, name, ret) {
      var af = new AngularFire($q, $parse, $timeout, ref);
      return af.associate(scope, name, ret);
    };
  }
]);

function AngularFire($q, $parse, $timeout, ref) {
  this._q = $q;
  this._parse = $parse;
  this._timeout = $timeout;

  this._initial = true;
  this._remoteValue = false;

  if (typeof ref == "string") {
    this._fRef = new Firebase(ref);
  } else {
    this._fRef = ref;
  }
}
AngularFire.prototype = {
  disassociate: function() {
    var self = this;
    if (self._unregister) {
      self._unregister();
    }
    this._fRef.off("value");
  },
  associate: function($scope, name, ret) {
    var self = this;
    if (ret == undefined) {
      ret = [];
    }
    var deferred = this._q.defer();
    var promise = deferred.promise;
    this._fRef.on("value", function(snap) {
      var resolve = false;
      if (deferred) {
        resolve = deferred;
        deferred = false;
      }
      self._remoteValue = ret;
      if (snap && snap.val() != undefined) {
        var val = snap.val();
        if (typeof val != typeof ret) {
          self._log("Error: type mismatch");
          return;
        }
        // Also distinguish between objects and arrays.
        var check = Object.prototype.toString;
        if (check.call(ret) != check.call(val)) {
          self._log("Error: type mismatch");
          return;
        }
        self._remoteValue = angular.copy(val);
        if (angular.equals(val, self._parse(name)($scope))) {
          return;
        }
      }
      self._timeout(function() {
        self._resolve($scope, name, resolve, self._remoteValue)
      });
    });
    return promise;
  },
  _log: function(msg) {
    if (console && console.log) {
      console.log(msg);
    }
  },
  _resolve: function($scope, name, deferred, val) {
    var self = this;
    this._parse(name).assign($scope, angular.copy(val));
    this._remoteValue = angular.copy(val);
    if (deferred) {
      deferred.resolve(function() {
        self.disassociate();
      });
      this._watch($scope, name);
    }
  },
  _watch: function($scope, name) {
    // Watch for local changes.
    var self = this;
    self._unregister = $scope.$watch(name, function() {
      if (self._initial) {
        self._initial = false;
        return;
      }
      var val = JSON.parse(angular.toJson(self._parse(name)($scope)));
      if (angular.equals(val, self._remoteValue)) {
        return;
      }
      self._fRef.ref().set(val);
    }, true);
  }
};

// Explicit syncing. Provides a collection object you can modify.
// Original code by @petebacondarwin, from:
// https://github.com/petebacondarwin/angular-firebase/blob/master/ng-firebase-collection.js
angular.module("firebase").factory("angularFireCollection", ["$timeout", function($timeout) {
  function angularFireItem(ref, index) {
    this.$ref = ref.ref();
    this.$id = ref.name();
    this.$index = index;
      angular.extend(this, {priority:ref.getPriority()}, ref.val());
  }

  return function(collectionUrlOrRef, initialCb) {
    var collection = [];
    var indexes = {};

    var collectionRef;
    if (typeof collectionUrlOrRef == "string") {
      collectionRef = new Firebase(collectionUrlOrRef);
    } else {
      collectionRef = collectionUrlOrRef;
    }

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

    if (initialCb && typeof initialCb == "function") {
      collectionRef.once("value", initialCb);
    }

    collectionRef.on("child_added", function(data, prevId) {
      $timeout(function() {
        var index = getIndex(prevId);
        addChild(index, new angularFireItem(data, index));
        updateIndexes(index);
      });
    });

    collectionRef.on("child_removed", function(data) {
      $timeout(function() {
        var id = data.name();
        var pos = indexes[id];
        removeChild(id);
        updateIndexes(pos);
      });
    });

    collectionRef.on("child_changed", function(data, prevId) {
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

    collectionRef.on("child_moved", function(ref, prevId) {
      $timeout(function() {
        var oldIndex = indexes[ref.name()];
        var newIndex = getIndex(prevId);
        var item = collection[oldIndex];
        moveChild(oldIndex, newIndex, item);
      });
    });

    collection.add = function(item, cb) {
      var ref;
      if (!cb) {
        ref = collectionRef.ref().push(item);
      } else {
        ref = collectionRef.ref().push(item, cb);
      }
      return ref;
    };
    collection.remove = function(itemOrId) {
      var item = angular.isString(itemOrId) ? collection[indexes[itemOrId]] : itemOrId;
      item.$ref.remove();
    };

    collection.update = function(itemOrId) {
      var item = angular.isString(itemOrId) ? collection[indexes[itemOrId]] : itemOrId;
      var copy = {};
      angular.forEach(item, function(value, key) {
        if (key.indexOf("$") !== 0) {
          copy[key] = value;
        }
      });
      item.$ref.set(copy);
    };

    return collection;
  };
}]);


// Authentication support for AngularFire.
angular.module("firebase").factory("angularFireAuth", [
  "$rootScope", "$parse", "$timeout", "$location", "$route",
  function($rootScope, $parse, $timeout, $location, $route) {

    function deconstructJWT(token) {
      var segments = token.split(".");
      if (!segments instanceof Array || segments.length !== 3) {
        throw new Error("Invalid JWT");
      }
      var claims = segments[1];
      return JSON.parse(decodeURIComponent(escape(window.atob(claims))));
    }

    function updateExpression(scope, name, val, cb) {
      if (name) {
        $timeout(function() {
          $parse(name).assign(scope, val);
          cb();
        });
      }
    }

    function authRequiredRedirect(route, path, self) {
      if (route.authRequired && !self._authenticated){
        if (route.pathTo === undefined) {
          self._redirectTo = $location.path();
        } else {
          self._redirectTo = route.pathTo === path ? "/" : route.pathTo;
        }
        $location.replace();
        $location.path(path);
      }
    }

    return {
      initialize: function(url, options) {
        var self = this;

        options = options || {};
        this._scope = $rootScope;
        if (options.scope) {
          this._scope = options.scope;
        }
        if (options.name) {
          this._name = options.name;
        }
        this._cb = function(){};
        if (options.callback && typeof options.callback === "function") {
          this._cb = options.callback;
        }

        this._redirectTo = null;
        this._authenticated = false;
        if (options.path) {
          authRequiredRedirect($route.current, options.path, self);
          $rootScope.$on("$routeChangeStart", function(e, next) {
            authRequiredRedirect(next, options.path, self);
          });
        }

        this._ref = new Firebase(url);
        if (options.simple && options.simple === false) {
          updateExpression(this._scope, this._name, null);
          return;
        }

        // Simple Login.
        if (!window.FirebaseSimpleLogin) {
          var err = new Error("FirebaseSimpleLogin undefined, " +
            "did you include firebase-simple-login.js?");
          $rootScope.$broadcast("angularFireAuth:error", err);
          return;
        }
        var client = new FirebaseSimpleLogin(this._ref, function(err, user) {
          self._cb(err, user);
          if (err) {
            $rootScope.$broadcast("angularFireAuth:error", err);
          } else if (user) {
            self._loggedIn(user)
          } else {
            self._loggedOut();
          }
        });
        this._authClient = client;
      },
      login: function(tokenOrProvider, options) {
        switch (tokenOrProvider) {
        case "github":
        case "persona":
        case "twitter":
        case "facebook":
        case "password":
          if (!this._authClient) {
            var err = new Error("Simple Login not initialized");
            $rootScope.$broadcast("angularFireAuth:error", err);
          } else {
            this._authClient.login(tokenOrProvider, options);
          }
          break;
        default:
          // Custom Login.
          var claims, self = this;
          try {
            claims = deconstructJWT(tokenOrProvider);
            this._ref.auth(tokenOrProvider, function(err) {
              if (err) {
                $rootScope.$broadcast("angularFireAuth:error", err);
              } else {
                self._loggedIn();
              }
            });
          } catch(e) {
            $rootScope.$broadcast("angularFireAuth:error", e)
          }
        }
      },
      logout: function() {
        if (this._authClient) {
          this._authClient.logout();
        } else {
          this._ref.unauth();
          this._loggedOut();
        }
      },
      _loggedIn: function(user) {
        var self = this;
        this._authenticated = true;
        updateExpression(this._scope, this._name, user, function() {
          $rootScope.$broadcast("angularFireAuth:login", user);
          if (self._redirectTo) {
            $location.replace();
            $location.path(self._redirectTo);
            self._redirectTo = null;
          }
        });
      },
      _loggedOut: function() {
        this._authenticated = false;
        updateExpression(this._scope, this._name, null, function() {
          $rootScope.$broadcast("angularFireAuth:logout");
        });
      }
    }
  }
]);
