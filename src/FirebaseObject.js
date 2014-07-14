(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseObject', [
    '$parse', '$firebaseUtils', '$log',
    function($parse, $firebaseUtils, $log) {
      function FirebaseObject($firebase, destroyFn) {
        var self = this, def = $firebaseUtils.defer();
        self.$conf = {
          promise: def.promise,
          inst: $firebase,
          bound: null,
          destroyFn: destroyFn,
          listeners: []
        };

        self.$id = $firebase.ref().name();
        self.$data = {};
        self.$priority = null;
        self.$conf.inst.ref().once('value',
          function() {
            $firebaseUtils.compile(def.resolve.bind(def, self));
          },
          function(err) {
            $firebaseUtils.compile(def.reject.bind(def, err));
          }
        );
      }

      FirebaseObject.prototype = {
        $updated: function(snap) {
          this.$id = snap.name();
          $firebaseUtils.updateRec(this, snap);
        },

        $error: function(err) {
          $log.error(err);
          this.$destroy();
        },

        $save: function() {
          return this.$conf.inst.set(this.$toJSON(this));
        },

        $loaded: function() {
          var promise = this.$conf.promise;
          if( arguments.length ) {
            promise = promise.then.apply(promise, arguments);
          }
          return promise;
        },

        $inst: function() {
          return this.$conf.inst;
        },

        $bindTo: function(scope, varName) {
          var self = this;
          return self.$loaded().then(function() {
            if( self.$conf.bound ) {
              throw new Error('Can only bind to one scope variable at a time');
            }


            // monitor scope for any changes
            var off = scope.$watch(varName, function() {
              var data = self.$toJSON($bound.get());
              if( !angular.equals(data, self.$data)) {
                self.$conf.inst.set(data);
              }
            }, true);

            var unbind = function() {
              if( self.$conf.bound ) {
                off();
                self.$conf.bound = null;
              }
            };

            // expose a few useful methods to other methods
            var parsed = $parse(varName);
            var $bound = self.$conf.bound = {
              set: function(data) {
                parsed.assign(scope, data);
              },
              get: function() {
                return parsed(scope);
              },
              unbind: unbind
            };

            scope.$on('$destroy', $bound.unbind);

            return unbind;
          });
        },

        $watch: function(cb, context) {
          var list = this.$conf.listeners;
          list.push([cb, context]);
          // an off function for cancelling the listener
          return function() {
            var i = list.findIndex(function(parts) {
              return parts[0] === cb && parts[1] === context;
            });
            if( i > -1 ) {
              list.splice(i, 1);
            }
          };
        },

        $destroy: function() {
          var self = this;
          if( !self.$isDestroyed ) {
            self.$isDestroyed = true;
            self.$conf.destroyFn();
            if( self.$conf.bound ) {
              self.$conf.bound.unbind();
            }
            $firebaseUtils.each(self, function(v,k) {
              delete self[k];
            });
          }
        },

        $toJSON: function() {
          var out = {};
          if( angular.isDefined(this.$value) ) {
            out['.value'] = this.$value;
          }
          else {
            $firebaseUtils.each(this, function(v,k) {
              out[k] = v;
            });
          }
          if( angular.isDefined(this.$priority) && this.$priority !== null ) {
            out['.priority'] = this.$priority;
          }
          return out;
        }
      };

      FirebaseObject.extendFactory = function(ChildClass, methods) {
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