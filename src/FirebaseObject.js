(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseObject', [
    '$parse', '$firebaseUtils', '$log',
    function($parse, $firebaseUtils, $log) {
      function FirebaseObject($firebase, destroyFn) {
        var self = this, def = $firebaseUtils.defer();
        self.$$conf = {
          promise: def.promise,
          inst: $firebase,
          bound: null,
          destroyFn: destroyFn,
          listeners: [],
          updated: function() {
            if( self.$$conf.bound ) {
              self.$$conf.bound.update();
            }
            angular.forEach(self.$$conf.listeners, function (parts) {
              parts[0].call(parts[1], {event: 'updated', key: self.$id});
            });
          }
        };

        self.$id = $firebase.$ref().name();
        self.$priority = null;
        self.$$conf.inst.$ref().once('value',
          function() {
            $firebaseUtils.compile(def.resolve.bind(def, self));
          },
          function(err) {
            $firebaseUtils.compile(def.reject.bind(def, err));
          }
        );
      }

      FirebaseObject.prototype = {
        $save: function () {
          return this.$inst().$set($firebaseUtils.toJSON(this));
        },

        $loaded: function () {
          var promise = this.$$conf.promise;
          if (arguments.length) {
            // allow this method to be called just like .then
            // by passing any arguments on to .then
            promise = promise.then.apply(promise, arguments);
          }
          return promise;
        },

        $inst: function () {
          return this.$$conf.inst;
        },

        $bindTo: function (scope, varName) {
          var self = this;
          return self.$loaded().then(function () {
            if (self.$$conf.bound) {
              throw new Error('Can only bind to one scope variable at a time');
            }

            var unbind = function () {
              if (self.$$conf.bound) {
                self.$$conf.bound = null;
                off();
              }
            };

            // expose a few useful methods to other methods
            var parsed = $parse(varName);
            var $bound = self.$$conf.bound = {
              update: function() {
                var curr = $bound.get();
                if( !angular.isObject(curr) ) {
                  curr = {};
                }
                $firebaseUtils.each(self, function(v,k) {
                  curr[k] = v;
                });
                curr.$id = self.$id;
                curr.$priority = self.$priority;
                if( self.hasOwnProperty('$value') ) {
                  curr.$value = self.$value;
                }
                parsed.assign(scope, curr);
              },
              get: function () {
                return parsed(scope);
              },
              unbind: unbind
            };

            $bound.update();
            scope.$on('$destroy', $bound.unbind);

            // monitor scope for any changes
            var off = scope.$watch(varName, function () {
              var newData = $firebaseUtils.toJSON($bound.get());
              var oldData = $firebaseUtils.toJSON(self);
              if (!angular.equals(newData, oldData)) {
                self.$inst().$set(newData);
              }
            }, true);

            return unbind;
          });
        },

        $watch: function (cb, context) {
          var list = this.$$conf.listeners;
          list.push([cb, context]);
          // an off function for cancelling the listener
          return function () {
            var i = list.findIndex(function (parts) {
              return parts[0] === cb && parts[1] === context;
            });
            if (i > -1) {
              list.splice(i, 1);
            }
          };
        },

        $destroy: function () {
          var self = this;
          if (!self.$isDestroyed) {
            self.$isDestroyed = true;
            self.$$conf.destroyFn();
            if (self.$$conf.bound) {
              self.$$conf.bound.unbind();
            }
            $firebaseUtils.each(self, function (v, k) {
              delete self[k];
            });
          }
        },

        $$updated: function (snap) {
          this.$id = snap.name();
          // applies new data to this object
          var changed = $firebaseUtils.updateRec(this, snap);
          if( changed ) {
            // notifies $watch listeners and
            // updates $scope if bound to a variable
            this.$$conf.updated();
          }
        },

        $$error: function (err) {
          $log.error(err);
          this.$destroy();
        }
      };

      FirebaseObject.$extendFactory = function(ChildClass, methods) {
        if( arguments.length === 1 && angular.isObject(ChildClass) ) {
          methods = ChildClass;
          ChildClass = function() { FirebaseObject.apply(this, arguments); };
        }
        return $firebaseUtils.inherit(ChildClass, FirebaseObject, methods);
      };

      return FirebaseObject;
    }
  ]);
})();