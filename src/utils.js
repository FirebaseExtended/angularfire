(function() {
  'use strict';

  angular.module('firebase')
    .factory('$firebaseConfig', ["$FirebaseArray", "$FirebaseObject",
      function($FirebaseArray, $FirebaseObject) {
        return function(configOpts) {
          return angular.extend({
            arrayFactory: $FirebaseArray,
            objectFactory: $FirebaseObject
          }, configOpts);
        };
      }
    ])

    .factory('$firebaseUtils', ["$q", "$timeout", "firebaseBatchDelay",
      function($q, $timeout, firebaseBatchDelay) {
        function batch(wait, maxWait) {
          if( !wait ) { wait = angular.isDefined(wait)? wait : firebaseBatchDelay; }
          if( !maxWait ) { maxWait = wait*10 || 100; }
          var list = [];
          var start;
          var timer;

          function addToBatch(fn, context) {
             if( typeof(fn) !== 'function' ) {
               throw new Error('Must provide a function to be batched. Got '+fn);
             }
             return function() {
               var args = Array.prototype.slice.call(arguments, 0);
               list.push([fn, context, args]);
               resetTimer();
             };
          }
          
          function resetTimer() {
            if( timer ) {
              clearTimeout(timer);
            }
            if( start && Date.now() - start > maxWait ) {
              compile(runNow);
            }
            else {
              if( !start ) { start = Date.now(); }
              timer = compile(runNow, wait);
            }
          }

          function runNow() {
            timer = null;
            start = null;
            var copyList = list.slice(0);
            list = [];
            angular.forEach(copyList, function(parts) {
              parts[0].apply(parts[1], parts[2]);
            });
          }

          return addToBatch;
        }

        function assertValidRef(ref, msg) {
          if( !angular.isObject(ref) ||
            typeof(ref.ref) !== 'function' ||
            typeof(ref.ref().transaction) !== 'function' ) {
            throw new Error(msg || 'Invalid Firebase reference');
          }
        }

        // http://stackoverflow.com/questions/7509831/alternative-for-the-deprecated-proto
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
        function inherit(ChildClass, ParentClass, methods) {
          var childMethods = ChildClass.prototype;
          ChildClass.prototype = Object.create(ParentClass.prototype);
          ChildClass.prototype.constructor = ChildClass; // restoring proper constructor for child class
          angular.forEach(Object.keys(childMethods), function(k) {
            ChildClass.prototype[k] = childMethods[k];
          });
          if( angular.isObject(methods) ) {
            angular.extend(ChildClass.prototype, methods);
          }
          return ChildClass;
        }

        function getPrototypeMethods(inst, iterator, context) {
          var methods = {};
          var objProto = Object.getPrototypeOf({});
          var proto = angular.isFunction(inst) && angular.isObject(inst.prototype)?
            inst.prototype : Object.getPrototypeOf(inst);
          while(proto && proto !== objProto) {
            for (var key in proto) {
              // we only invoke each key once; if a super is overridden it's skipped here
              if (proto.hasOwnProperty(key) && !methods.hasOwnProperty(key)) {
                methods[key] = true;
                iterator.call(context, proto[key], key, proto);
              }
            }
            proto = Object.getPrototypeOf(proto);
          }
        }

        function getPublicMethods(inst, iterator, context) {
          getPrototypeMethods(inst, function(m, k) {
            if( typeof(m) === 'function' && k.charAt(0) !== '_' ) {
              iterator.call(context, m, k);
            }
          });
        }

        function defer() {
          return $q.defer();
        }

        function reject(msg) {
          return $q.reject(msg);
        }

        function resolve() {
          var def = defer();
          def.resolve.apply(def, arguments);
          return def.promise;
        }

        function compile(fn, wait) {
          $timeout(fn||function() {}, wait||0);
        }

        function updateRec(rec, snap) {
          var data = snap.val();
          var oldData = angular.extend({}, rec);

          // deal with primitives
          if( !angular.isObject(data) ) {
            data = {$value: data};
          }

          // remove keys that don't exist anymore
          delete rec.$value;
          each(rec, function(val, key) {
            if( !data.hasOwnProperty(key) ) {
              delete rec[key];
            }
          });

          // apply new values
          angular.extend(rec, data);
          rec.$priority = snap.getPriority();

          return !angular.equals(oldData, rec) ||
            oldData.$value !== rec.$value ||
            oldData.$priority !== rec.$priority;
        }

        function each(obj, iterator, context) {
          angular.forEach(obj, function(v,k) {
            var c = k.charAt(0);
            if( c !== '_' && c !== '$' ) {
              iterator.call(context, v, k, obj);
            }
          });
        }

        /**
         * A utility for converting records to JSON objects
         * which we can save into Firebase. It asserts valid
         * keys and strips off any items prefixed with $.
         *
         * If the rec passed into this method has a toJSON()
         * method, that will be used in place of the custom
         * functionality here.
         *
         * @param rec
         * @returns {*}
         */
        function toJSON(rec) {
          var dat;
          if (angular.isFunction(rec.toJSON)) {
            dat = rec.toJSON();
          }
          else if(rec.hasOwnProperty('$value')) {
            dat = {'.value': rec.$value};
          }
          else {
            dat = {};
            each(rec, function (v, k) {
              dat[k] = v;
            });
          }
          if( rec.hasOwnProperty('$priority') && Object.keys(dat).length > 0 ) {
            dat['.priority'] = rec.$priority;
          }
          angular.forEach(dat, function(v,k) {
            if (k.match(/[.$\[\]#\/]/) && k !== '.value' && k !== '.priority' ) {
              throw new Error('Invalid key ' + k + ' (cannot contain .$[]#)');
            }
            else if( angular.isUndefined(v) ) {
              throw new Error('Key '+k+' was undefined. Cannot pass undefined in JSON. Use null instead.');
            }
          });
          return dat;
        }

        return {
          batch: batch,
          compile: compile,
          updateRec: updateRec,
          assertValidRef: assertValidRef,
          batchDelay: firebaseBatchDelay,
          inherit: inherit,
          getPrototypeMethods: getPrototypeMethods,
          getPublicMethods: getPublicMethods,
          reject: reject,
          resolve: resolve,
          defer: defer,
          allPromises: $q.all.bind($q),
          each: each,
          toJSON: toJSON
        };
      }
    ]);
})();