(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseObject', [
    '$parse', '$firebaseUtils',
    function($parse, $firebaseUtils) {
      function FirebaseObject($firebase) {
        var self = this;
        self.$promise = $firebaseUtils.defer();
        self.$inst = $firebase;
        self.$id = $firebase.ref().name();
        self.$bound = null;

        var compile = $firebaseUtils.debounce(function() {
          if( self.$bound ) {
            self.$bound.assign(self.$bound.scope, self.toJSON());
          }
        });

        self.serverUpdate = function(snap) {
          var existingKeys = Object.keys(self);
          var newData = snap.val();
          if( !angular.isObject(newData) ) { newData = {}; }
          angular.forEach(existingKeys, function(k) {
            if( !newData.hasOwnProperty(k) ) {
              delete self[k];
            }
          });
          angular.forEach(newData, function(v,k) {
            self[k] = v;
          });
          compile();
        };

        // prevent iteration and accidental overwrite of props
        readOnlyProp(self, '$inst');
        readOnlyProp(self, '$id');
        readOnlyProp(self, '$bound', true);
        readOnlyProp(self, '$promise');
        angular.forEach(FirebaseObject.prototype, function(v,k) {
          readOnlyProp(self, k);
        });

        // get this show on the road
        self.$inst.ref().on('value', self.serverUpdate);
        self.$inst.ref().once('value',
          self.$promise.resolve.bind(self.$promise, self),
          self.$promise.reject.bind(self.$promise)
        );
      }

      FirebaseObject.prototype = {
        save: function() {
          return self.$inst.set(self.$id, self.toJSON());
        },

        loaded: function() {
          return self.$promise;
        },

        inst: function() {
          return this.$inst;
        },

        bindTo: function(scope, varName) {
          var self = this;
          if( self.$bound ) {
            throw new Error('Can only bind to one scope variable at a time');
          }
          self.$bound = $parse(varName);
          self.$bound.scope = scope;
          var off = scope.$watch(varName, function() {
            var data = parseJSON(self.$bound(scope));
            self.$inst.set(self.$id, data);
          });

          return function() {
            off();
            self.$bound = null;
          }
        },

        destroy: function() {},

        toJSON: function() {
          return parseJSON(this);
        },

        forEach: function(iterator, context) {
          var self = this;
          angular.forEach(Object.keys(self), function(k) {
            iterator.call(context, self[k], k, self);
          });
        }
      };

      return FirebaseObject;
    }
  ]);

  function parseJSON(self) {
    var out = {};
    angular.forEach(Object.keys(self), function(k) {
      if( !k.match(/^$/) ) {
        out[k] = self[k];
      }
    });
    return out;
  }

  function readOnlyProp(obj, key, writable) {
    if( Object.defineProperty ) {
      Object.defineProperty(obj, key, {
        writable: writable||false,
        enumerable: false,
        value: obj[key]
      });
    }
  }
})();