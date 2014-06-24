(function() {
  'use strict';
  angular.module('firebase').factory('$FirebaseObject', [
    '$parse', '$firebaseUtils',
    function($parse, $firebaseUtils) {
      function FirebaseObject($firebase) {
        var self = this, def = $firebaseUtils.defer();
        var factory = $firebase.getRecordFactory();
        self.$conf = {
          def: def,
          inst: $firebase,
          bound: null,
          factory: factory,
          serverUpdate: function(snap) {
            factory.update(self, snap);
            compile();
          }
        };
        self.$id = $firebase.ref().name();

        var compile = $firebaseUtils.debounce(function() {
          if( self.$conf.bound ) {
            self.$conf.bound.set(self.toJSON());
          }
        });

        // prevent iteration and accidental overwrite of props
        var methods = ['$id', '$conf']
          .concat(Object.keys(FirebaseObject.prototype));
        angular.forEach(methods, function(key) {
          readOnlyProp(self, key, key === '$bound');
        });

        // listen for updates to the data
        self.$conf.inst.ref().on('value', self.$conf.serverUpdate);
        // resolve the loaded promise once data is downloaded
        self.$conf.inst.ref().once('value',
          def.resolve.bind(def, self),
          def.reject.bind(def)
        );
      }

      FirebaseObject.prototype = {
        save: function() {
          return this.$conf.inst.set(this.$conf.factory.toJSON(this));
        },

        loaded: function() {
          return this.$conf.def.promise;
        },

        inst: function() {
          return this.$conf.inst;
        },

        bindTo: function(scope, varName) {
          var self = this;
          if( self.$conf.bound ) {
            throw new Error('Can only bind to one scope variable at a time');
          }

          var parsed = $parse(varName);

          // monitor scope for any changes
          var off = scope.$watch(varName, function() {
            var data = self.$conf.factory.toJSON(parsed(scope));
            self.$conf.inst.set(self.$id, data);
          });

          var unbind = function() {
            if( self.$conf.bound ) {
              off();
              self.$conf.bound = null;
            }
          };

          // expose a few useful methods to other methods
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

          var def = $firebaseUtils.defer();
          self.loaded().then(function() {
            def.resolve(unbind);
          }, def.reject.bind(def));

          return def.promise;
        },

        destroy: function() {
          var self = this;
          if( !self.$isDestroyed ) {
            self.$isDestroyed = true;
            self.$conf.inst.ref().off('value', self.$conf.serverUpdate);
            if( self.$conf.bound ) {
              self.$conf.bound.unbind();
            }
            self.forEach(function(v,k) {
              delete self[k];
            });
            self.$isDestroyed = true;
          }
        },

        toJSON: function() {
          return angular.extend({}, this);
        },

        forEach: function(iterator, context) {
          var self = this;
          angular.forEach(Object.keys(self), function(k) {
            if( !k.match(/^\$/) ) {
              iterator.call(context, self[k], k, self);
            }
          });
        }
      };

      return FirebaseObject;
    }
  ]);

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