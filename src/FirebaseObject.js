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
            factory.update(self.$data, snap);
            self.$priority = snap.getPriority();
            compile();
          }
        };

        self.$id = $firebase.ref().name();
        self.$data = {};
        self.$priority = null;

        var compile = $firebaseUtils.debounce(function() {
          if( self.$conf.bound ) {
            self.$conf.bound.set(self.toJSON());
          }
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
          var self = this, loaded = false;
          if( self.$conf.bound ) {
            throw new Error('Can only bind to one scope variable at a time');
          }


          // monitor scope for any changes
          var off = scope.$watchCollection(varName, function() {
            var data = self.$conf.factory.toJSON($bound.get());
            if( loaded ) { self.$conf.inst.set(data); }
          });

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

          var def = $firebaseUtils.defer();
          self.loaded().then(function() {
            loaded = true;
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
              delete self.$data[k];
            });
            self.$isDestroyed = true;
          }
        },

        toJSON: function() {
          var out = {};
          this.forEach(function(v,k) {
            out[k] = v;
          });
          return out;
        },

        forEach: function(iterator, context) {
          var self = this;
          angular.forEach(self.$data, function(v,k) {
            iterator.call(context, v, k, self);
          });
        }
      };

      return FirebaseObject;
    }
  ]);
})();