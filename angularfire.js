// AngularFire is an officially supported AngularJS binding for Firebase.
// The bindings let you associate a Firebase URL with a model (or set of
// models), and they will be transparently kept in sync across all clients
// currently using your app. The 2-way data binding offered by AngularJS works
// as normal, except that the changes are also sent to all other clients
// instead of just a server.
//
//      AngularFire 0.5
//      http://angularfire.com
//      License: MIT

"use strict";

var AngularFire;

// Define the `firebase` module under which all AngularFire services will live.
angular.module("firebase", []).value("Firebase", Firebase);

// Define the `$firebase` service that provides synchronization methods.
angular.module("firebase").factory("$firebase", ["$q", "$parse", "$timeout",
  function($q, $parse, $timeout) {
    // The factory returns an object containing the value of the data at
    // the Firebase location provided, as well as several methods. It
    // takes a single argument:
    //
    //   * `ref`:    A Firebase reference. Queries or limits may be applied.
    return function(ref) {
      var af = new AngularFire($q, $parse, $timeout, ref);
      return af.construct();
    };
  }
]);

// The `AngularFire` object that implements synchronization.
AngularFire = function($q, $parse, $timeout, ref) {
  this._q = $q;
  this._bound = false;
  this._parse = $parse;
  this._timeout = $timeout;

  if (typeof ref == "string") {
    throw new Error("Please provide a Firebase reference instead " +
      "of a URL, eg: new Firebase(url)");
  }
  this._fRef = ref;
};

AngularFire.prototype = {
  // This function is called by the factory to create a new explicit sync
  // point between a particular model and a Firebase location.
  construct: function() {
    var self = this;
    var object = {};

    // Establish a 3-way data binding (implicit sync) with the specified
    // Firebase location and a model on $scope. To be used from a controller
    // to automatically synchronize *all* local changes. It take two arguments:
    //
    //    * `$scope`: The scope with which the bound model is associated.
    //    * `name`:   The name of the model.
    //
    // This function also returns a promise, which when resolve will be
    // provided an `unbind` method, a function which you can call to stop
    // watching the local model for changes.
    object.$bind = function(scope, name) {
      return self._bind(scope, name);
    };

    // Add an object to the remote data. Adding an object is the
    // equivalent of calling `push()` on a Firebase reference.
    object.$add = function(item) {
      // We use toJson/fromJson to remove $$hashKey. Can be replaced by
      // angular.copy, but only for later versions of AngularJS.
      self._fRef.ref().push(angular.fromJson(angular.toJson(item)));
    };

    // Save the current state of the object to the remote data. Saving an
    // object is the equivalent of calling `update()` on a Firebase reference.
    object.$save = function() {
      self._fRef.ref().update(angular.fromJson(angular.toJson(self._object)));
    };

    // Set the current state of the object to the remote data as-is. Calling
    // this is the equivalent of calling `set()` on a Firebase reference.
    object.$set = function() {
      self._fRef.ref().set(angular.fromJson(angular.toJson(self._object)));
    };

    // Remove this object from the remote data. Calling this is the equivalent
    // of calling `remove()` on a Firebase reference.
    object.$remove = function() {
      self._fRef.ref().remove();
    };

    // Attach an event handler for when the object is changed. Currently
    // take a single type of argument, "change", with a callback.
    object.$on = function(type, callback) {
      if (type != "change") {
        throw new Error("Invalid event type " + type + " specified");
      }
      self._onChange = callback;
    };

    self._object = object;
    self._getInitialValue();

    return self._object;
  },

  // This function is responsible for fetching the initial data for the
  // given reference. If the data returned from the server is an object or
  // array, we'll attach appropriate child event handlers. If the value is
  // a primitive, we'll continue to watch for value changes.
  _getInitialValue: function() {
    var self = this;
    self._fRef.on("value", function(snapshot) {
      var value = snapshot.val();
      switch (typeof value) {
      // For primitive values, simply update the object returned.
      case "string":
      case "number":
      case "boolean":
        self._updatePrimitive(value);
        break;
      // For arrays and objects, switch to child methods.
      case "object":
        self._getChildValues();
        self._fRef.off("value");
        break;
      default:
        throw new Error("Unexpected type from remote data " + typeof value);
      }
    });
  },

  // This function attaches child events for object and array types.
  _getChildValues: function() {
    var self = this;
    self._fRef.on("child_added", function(snapshot) {
      self._updateModel(snapshot.name(), snapshot.val());
    });
    self._fRef.on("child_changed", function(snapshot) {
      self._updateModel(snapshot.name(), snapshot.val());
    });
    self._fRef.on("child_removed", function(snapshot) {
      // 'null' mean deleted in Firebase.
      self._updateModel(snapshot.name(), null);
    });
    // TODO: Implement child_moved and ordering of items.
  },

  // Called whenever there is a remote change. Applies them to the local
  // model for both explicit and implicit sync modes.
  _updateModel: function(key, value) {
    var self = this;
    self._timeout(function() {
      if (value == null) {
        delete self._object[key];
      } else {
        self._object[key] = value;
      }

      if (self._onChange && typeof self._onChange == "function") {
        self._onChange();
      }

      // If there is an implicit binding, also update the local model.
      if (!self._bound) {
        return;
      }

      var current = self._object;
      var local = self._parse(self._name)(self._scope);
      // If remote value matches local value, don't do anything, otherwise
      // apply the change.
      if (!angular.equals(current, local)) {
        self._parse(self._name).assign(self._scope, angular.copy(current));
      }
    });
  },

  // Called whenever there is a remote change for a primitive value.
  _updatePrimitive: function(value) {
    var self = this;
    self._timeout(function() {
      // Primitive values are represented as a special object {$value: value}.
      self._object.$value = value;

      // Call onChange handler, if one is associated.
      if (self._onChange && typeof self._onChange == "function") {
        self._onChange();
      }

      // If there's an implicit binding, simply update the local scope model.
      if (self._bound) {
        var local = self._parse(self._name)(self._scope);
        if (!angular.equals(value, local)) {
          self._parse(self._name).assign(self._scope, value);
        }
      }
    });
  },

  // This function creates a 3-way binding between the provided scope model
  // and Firebase. All changes made to the local model are saved to Firebase
  // and changes to the remote data automatically appear on the local model.
  _bind: function(scope, name) {
    var self = this;
    var deferred = self._q.defer();

    // _updateModel will take care of updating the local model if _bound
    // is set to true.
    self._name = name;
    self._bound = true;
    self._scope = scope;

    // If the model on $scope is not set yet, make it an object.
    var local = self._parse(name)(scope);
    if (local === undefined) {
      self._parse(name).assign(scope, {});
    } else {
      self._fRef.update(angular.fromJson(angular.toJson(local)));
    }

    // We're responsible for setting up scope.$watch to reflect local changes
    // on the Firebase data.
    var unbind = scope.$watch(name, function() {
      // If the new local value matches the current remote value, we don't
      // trigger a remote update.
      local = angular.fromJson(angular.toJson(self._parse(name)(scope)));
      if (angular.equals(local, self._object)) {
        return;
      }
      // Use update if limits are in effect, set if not.
      if (self._fRef.set) {
        self._fRef.set(local);
      } else {
        self._fRef.ref().update(local);
      }
    }, true);

    // When the scope is destroyed, unbind automatically.
    scope.$on("$destroy", function() {
      unbind();
    });

    // Once we receive the initial value, resolve the promise.
    self._fRef.once("value", function() {
      deferred.resolve(unbind);
    });

    return deferred.promise;
  }
};
