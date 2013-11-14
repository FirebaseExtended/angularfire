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

// Define the `orderByPriority` filter that sorts objects returned by
// $firebase in the order of priority. Priority is defined by Firebase,
// for more info see: https://www.firebase.com/docs/ordered-data.html
angular.module("firebase").filter("orderByPriority", function() {
  return function(input) {
    if (!input.$getIndex || typeof input.$getIndex != "function") {
      return input;
    }

    var sorted = [];
    var index = input.$getIndex();
    if (index.length <= 0) {
      return input;
    }

    for (var i = 0; i < index.length; i++) {
      var val = input[index[i]];
      if (val) {
        val.$id = index[i];
        sorted.push(val);
      }
    }

    return sorted;
  };
});

// The `AngularFire` object that implements synchronization.
AngularFire = function($q, $parse, $timeout, ref) {
  this._q = $q;
  this._bound = false;
  this._parse = $parse;
  this._timeout = $timeout;

  this._index = [];
  this._onChange = [];
  this._onLoaded = [];

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
      if (typeof item == "object") {
        self._fRef.ref().push(self._parseObject(item));
      } else {
        self._fRef.ref().push(item);
      }
    };

    // Save the current state of the object (or a child) to the remote.
    // Takes a single optional argument:
    //
    //    * `key`: Specify a child key to save the data for. If no key is
    //             specified, the entire object's current state will be saved.
    object.$save = function(key) {
      if (key) {
        self._fRef.ref().child(key).set(self._parseObject(self._object[key]));
      } else {
        self._fRef.ref().set(self._parseObject(self._object));
      }
    };

    // Set the current state of the object to the specified value. Calling
    // this is the equivalent of calling `set()` on a Firebase reference.
    object.$set = function(newValue) {
      self._fRef.ref().set(newValue);
    };

    // Remove this object from the remote data. Calling this is the equivalent
    // of calling `remove()` on a Firebase reference. This function takes a
    // single optional argument:
    //
    //    * `key`: Specify a child key to remove. If no key is specified, the
    //             entire object will be removed from the remote data store.
    object.$remove = function(key) {
      if (key) {
        self._fRef.ref().child(key).remove();
      } else {
        self._fRef.ref().remove();
      }
    };

    // Get an AngularFire wrapper for a named child.
    object.$child = function(key) {
      var af = new AngularFire(
        this._q, this._parse, this._timeout, this._fRef.ref().child(key)
      );
      return af.construct();
    };

    // Attach an event handler for when the object is changed. You can attach
    // handlers for the following events:
    //
    //  - "change": The provided function will be called whenever the local
    //              object is modified because the remote data was updated.
    //  - "loaded": This function will be called *once*, when the initial
    //              data has been loaded. 'object' will be an empty object ({})
    //              until this function is called.
    object.$on = function(type, callback) {
      switch (type) {
      case "change":
        self._onChange.push(callback);
        break;
      case "loaded":
        self._onLoaded.push(callback);
        break;
      default:
        throw new Error("Invalid event type " + type + " specified");
      }
    };

    // Return the current index, which is a list of key names in an array,
    // ordered by their Firebase priority.
    object.$getIndex = function() {
      return angular.copy(self._index);
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

      // Call handlers for the "loaded" event.
      self._broadcastEvent("loaded", value);
    });
  },

  // This function attaches child events for object and array types.
  _getChildValues: function() {
    var self = this;
    // Store the priority of the current property as "$priority". This can
    // be used with the `toArray | orderBy:'$priority'` filter to sort objects.
    function _processSnapshot(snapshot, prevChild) {
      var key = snapshot.name();
      var val = snapshot.val();

      // If the item already exists in the index, remove it first.
      var curIdx = self._index.indexOf(key);
      if (curIdx !== -1) {
        self._index.splice(curIdx, 1);
      }

      // Update index. This is used by $getIndex and the orderByPriority filter.
      if (prevChild) {
        var prevIdx = self._index.indexOf(prevChild);
        self._index.splice(prevIdx + 1, 0, key);
      } else {
        self._index.unshift(key);
      }

      // Update local model with priority field, if needed.
      if (snapshot.getPriority() !== null) {
        val.$priority = snapshot.getPriority();
      }
      self._updateModel(key, val);
    }

    self._fRef.on("child_added", _processSnapshot);
    self._fRef.on("child_moved", _processSnapshot);
    self._fRef.on("child_changed", _processSnapshot);
    self._fRef.on("child_removed", function(snapshot) {
      // Remove from index.
      var key = snapshot.name();
      var idx = self._index.indexOf(key);
      self._index.splice(idx, 1);

      // Remove from local model.
      self._updateModel(key, null);
    });
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

      // Call change handlers.
      self._broadcastEvent("change");

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

      // Call change handlers.
      self._broadcastEvent("change");

      // If there's an implicit binding, simply update the local scope model.
      if (self._bound) {
        var local = self._parse(self._name)(self._scope);
        if (!angular.equals(value, local)) {
          self._parse(self._name).assign(self._scope, value);
        }
      }
    });
  },

  // If event handlers for a specified event were attached, call them.
  _broadcastEvent: function(evt, param) {
    var cbs;
    switch (evt) {
    case "change":
      cbs = this._onChange;
      break;
    case "loaded":
      cbs = this._onLoaded;
      break;
    default:
      cbs = [];
      break;
    }
    if (cbs.length > 0) {
      for (var i = 0; i < cbs.length; i++) {
        if (typeof cbs[i] == "function") {
          cbs[i](param);
        }
      }
    }
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
      self._fRef.update(self._parseObject(local));
    }

    // We're responsible for setting up scope.$watch to reflect local changes
    // on the Firebase data.
    var unbind = scope.$watch(name, function() {
      // If the new local value matches the current remote value, we don't
      // trigger a remote update.
      local = self._parseObject(self._parse(name)(scope));
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
  },

  // Parse a local model, removing all properties beginning with "$" and
  // converting $priority to ".priority".
  _parseObject: function(obj) {
    function _findReplacePriority(item) {
      for (var prop in item) {
        if (item.hasOwnProperty(prop)) {
          if (prop == "$priority") {
            item[".priority"] = item.$priority;
            delete item.$priority;
          } else if (typeof item[prop] == "object") {
            _findReplacePriority(item[prop]);
          }
        }
      }
      return item;
    }

    // We use toJson/fromJson to remove $$hashKey and others. Can be replaced
    // by angular.copy, but only for later versions of AngularJS.
    return angular.fromJson(angular.toJson(_findReplacePriority(obj)));
  }
};
