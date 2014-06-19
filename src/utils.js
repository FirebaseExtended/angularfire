(function() {
  'use strict';

  angular.module('firebase')
    .factory('$firebaseConfig', ["$firebaseRecordFactory", "$FirebaseArray", "$FirebaseObject",
      function($firebaseRecordFactory, $FirebaseArray, $FirebaseObject) {
        return function(configOpts) {
          return angular.extend({}, {
            recordFactory: $firebaseRecordFactory,
            arrayFactory: $FirebaseArray,
            objectFactory: $FirebaseObject
          }, configOpts);
        };
      }
    ])

    .factory('$firebaseUtils', ["$timeout", "firebaseBatchDelay", '$firebaseRecordFactory',
      function($timeout, firebaseBatchDelay, $firebaseRecordFactory) {
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
                opts.scope.$apply(launch);
                try {
                }
                catch(e) {
                  console.error(e);
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

        function assertValidRecordFactory(factory) {
          if( !angular.isObject(factory) ) {
            throw new Error('Invalid argument passed for $firebaseRecordFactory');
          }
          for (var key in $firebaseRecordFactory) {
            if ($firebaseRecordFactory.hasOwnProperty(key) &&
              typeof($firebaseRecordFactory[key]) === 'function' && key !== 'isValidFactory') {
              if( !factory.hasOwnProperty(key) || typeof(factory[key]) !== 'function' ) {
                throw new Error('Record factory does not have '+key+' method');
              }
            }
          }
        }

        // http://stackoverflow.com/questions/7509831/alternative-for-the-deprecated-proto
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
        function inherit(childClass,parentClass) {
          childClass.prototype = Object.create(parentClass.prototype);
          childClass.prototype.constructor = childClass; // restoring proper constructor for child class
        }

        function getPublicMethods(inst) {
          var methods = {};
          for (var key in inst) {
            //noinspection JSUnfilteredForInLoop
            if (typeof(inst[key]) === 'function' && !/^_/.test(key)) {
              methods[key] = inst[key];
            }
          }
          return methods;
        }

        return {
          debounce: debounce,
          assertValidRef: assertValidRef,
          assertValidRecordFactory: assertValidRecordFactory,
          batchDelay: firebaseBatchDelay,
          inherit: inherit,
          getPublicMethods: getPublicMethods
        };
      }]);

})();