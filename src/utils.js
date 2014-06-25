(function() {
  'use strict';

  angular.module('firebase')
    .factory('$firebaseConfig', ["$firebaseRecordFactory", "$FirebaseArray", "$FirebaseObject",
      function($firebaseRecordFactory, $FirebaseArray, $FirebaseObject) {
        return function(configOpts) {
          return angular.extend({
            recordFactory: $firebaseRecordFactory,
            arrayFactory: $FirebaseArray,
            objectFactory: $FirebaseObject
          }, configOpts);
        };
      }
    ])

    .factory('$firebaseUtils', ["$q", "$timeout", "firebaseBatchDelay", "$log",
      function($q, $timeout, firebaseBatchDelay, $log) {
        function debounce(fn, wait, options) {
          if( !wait ) { wait = 0; }
          var opts = angular.extend({maxWait: wait*25||250}, options);
          var to, startTime = null, maxWait = opts.maxWait;
          function cancelTimer() {
            if( to ) { clearTimeout(to); }
          }

          function init() {
            if( !startTime ) {
              startTime = Date.now();
            }
          }

          function delayLaunch() {
            init();
            cancelTimer();
            if( Date.now() - startTime > maxWait ) {
              launch();
            }
            else {
              to = timeout(launch, wait);
            }
          }

          function timeout() {
            if( opts.scope ) {
              to = setTimeout(function() {
                try {
                  //todo should this be $digest?
                  opts.scope.$apply(launch);
                }
                catch(e) {
                  $log.error(e);
                }
              }, wait);
            }
            else {
              to = $timeout(launch, wait);
            }
          }

          function launch() {
            startTime = null;
            fn();
          }

          return delayLaunch;
        }

        function assertValidRef(ref, msg) {
          if( !angular.isObject(ref) ||
            typeof(ref.ref) !== 'function' ||
            typeof(ref.transaction) !== 'function' ) {
            throw new Error(msg || 'Invalid Firebase reference');
          }
        }

        // http://stackoverflow.com/questions/7509831/alternative-for-the-deprecated-proto
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
        function inherit(childClass,parentClass) {
          childClass.prototype = Object.create(parentClass.prototype);
          childClass.prototype.constructor = childClass; // restoring proper constructor for child class
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
            if( typeof(m) === 'function' && !/^_/.test(k) ) {
              iterator.call(context, m, k);
            }
          });
        }

        function defer() {
          return $q.defer();
        }

        function reject(msg) {
          var def = defer();
          def.reject(msg);
          return def.promise;
        }

        return {
          debounce: debounce,
          assertValidRef: assertValidRef,
          batchDelay: firebaseBatchDelay,
          inherit: inherit,
          getPrototypeMethods: getPrototypeMethods,
          getPublicMethods: getPublicMethods,
          reject: reject,
          defer: defer
        };
      }
    ]);

})();