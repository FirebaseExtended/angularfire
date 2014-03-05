(function() {

   /**
    * A mock that simulates Firebase operations for use in unit tests.
    *
    * ## Setup
    *
    *     // in windows
    *     MockFirebase.stub(window, 'Firebase'); // replace window.Firebase
    *
    *     // in node.js
    *     var Firebase = require('../lib/MockFirebase');
    *
    * ## Usage Examples
    *
    *     var fb = new Firebase('Mock://foo/bar');
    *     fb.on('value', function(snap) {
    *        console.log(snap.val());
    *     });
    *
    *     // do something async or synchronously...
    *
    *     // trigger callbacks and event listeners
    *     fb.flush();
    *
    *     // spy on methods
    *     expect(fb.on.called).toBe(true);
    *
    * ## Trigger events automagically instead of calling flush()
    *
    *     var fb = new MockFirebase('Mock://hello/world');
    *     fb.autoFlush(1000); // triggers events after 1 second
    *     fb.autoFlush(); // triggers events immediately
    *
    * ## Simulating Errors
    *
    *     var fb = new MockFirebase('Mock://fails/a/lot');
    *     fb.failNext('set', new Error('PERMISSION_DENIED'); // create an error to be invoked on the next set() op
    *     fb.set({foo: bar}, function(err) {
    *         // err.message === 'PERMISSION_DENIED'
    *     });
    *     fb.flush();
    *
    * @param {string} [currentPath] use a relative path here or a url, all .child() calls will append to this
    * @param {Object} [data] specify the data in this Firebase instance (defaults to MockFirebase.DEFAULT_DATA)
    * @param {MockFirebase} [parent] for internal use
    * @param {string} [name] for internal use
    * @constructor
    */
   function MockFirebase(currentPath, data, parent, name) {
      // we use the actual data object here which can have side effects
      // important to keep in mind if you pass data here and then try to
      // use it later; we do this so that calling set on child paths
      // also updates the parent
      this.data = arguments.length > 1 || parent? data||null : _.cloneDeep(MockFirebase.DEFAULT_DATA);
      this.errs = {};
      this.currentPath = currentPath || 'Mock://';
      this.parent = parent||null;
      this.myName = parent? name : extractName(currentPath);
      this.flushDelay = false;
      this.children = [];
      parent && parent.children.push(this);
      this._events = { value: [], child_added: [], child_removed: [], child_changed: [], child_moved: [] };
      this.ops = [];

      for(var key in this)
         if( this.hasOwnProperty(key) && typeof(this[key]) === 'function' )
            sinon.spy(this, key);
   }

   MockFirebase.prototype = {
      /**
       * Invoke all the operations that have been queued thus far. If a numeric delay is specified, this
       * occurs asynchronously. Otherwise, it is a synchronous event.
       *
       * If you call this multiple times with different delay values, you could invoke the events out
       * of order; make sure that is your intention.
       *
       * @param {boolean|int} [delay]
       * @returns {MockFirebase}
       */
      flush: function(delay) {
         var self = this, list = self.ops;
         self.ops = [];
         if( _.isNumber(delay) ) {
            setTimeout(process, delay);
         }
         else {
            process();
         }
         function process() {
            list.forEach(function(parts) {
               parts[0].apply(self, parts.slice(1));
            });
            self.children.forEach(function(c) {
               c.flush();
            });
         }
         return self;
      },

      /** @param {int} [delay] */
      autoFlush: function(delay){
         this.flushDelay = _.isUndefined(delay)? true : delay;
         this.children.forEach(function(c) {
            c.autoFlush(delay);
         });
         delay !== false && this.flush(delay);
         return this;
      },

      failNext: function(event, error) {
         this.errs[event] = error;
      },

      toString: function() {
         return this.currentPath;
      },

      child: function(childPath) {
         var ref = this, parts = childPath.split('/');
         parts.forEach(function(p) {
            var v = _.isObject(ref.data) && _.has(ref.data, p)? ref.data[p] : null;
            ref = new MockFirebase(mergePaths(ref.currentPath, p), v, ref, p);
         });
         ref.flushDelay = this.flushDelay;
         return ref;
      },

      set: function(data, callback) {
         var self = this;
         var err = this._nextErr('set');
         data = _.cloneDeep(data);
         this._defer(function() {
            if( err === null ) {
               self._dataChanged(data);
            }
            callback && callback(err);
         });
         return this;
      },

      name: function() {
         return this.myName;
      },

      ref: function() {
         return this;
      },

      once: function(event, callback) {
         function fn(snap) {
            this.off(event, fn);
            callback(snap);
         }
         this.on(event, fn);
      },

      on: function(event, callback) { //todo cancelCallback?
         this._events[event].push(callback);
         var data = this.data, self = this;
         if( event === 'value' ) {
            this._defer(function() {
               callback(makeSnap(self, data))
            });
         }
         else if( event === 'child_added' ) {
            this._defer(function() {
               _.each(data, function(v, k) {
                  callback(makeSnap(self.child(k), v));
               });
            });
         }
      },

      off: function(event, callback) {
         if( !event ) {
            for (var key in this._events)
               if( this._events.hasOwnProperty(key) )
                  this.off(key);
         }
         else if( callback ) {
            this._events[event] = _.without(this._events[event], callback);
         }
         else {
            this._events[event] = [];
         }
      },

      transaction: function(valueFn, finishedFn, applyLocally) {
         var self = this;
         var valueSpy = sinon.spy(valueFn);
         var finishedSpy = sinon.spy(finishedFn);
         this._defer(function() {
            var err = this._nextErr('transaction');
            var res = valueSpy(_.isObject(self.data)? _.cloneDeep(self.data) : _.isUndefined(self.data)? null : self.data);
            var newData = _.isUndefined(res) || err? this.data : res;
            finishedSpy(err, err === null && !_.isUndefined(res), makeSnap(self, newData));
            this._dataChanged(newData);
         });
         return [valueSpy, finishedSpy, applyLocally];
      },

      _childChanged: function(ref, data) {
         if( !_.isObject(this.data) ) { this.data = {}; }
         this.data[ref.name()] = _.cloneDeep(data);
         this._trigger('child_changed', data);
         this._trigger('value', this.data);
         this.parent && this.parent._childChanged(this, this.data);
      },

      _dataChanged: function(data) {
         if( !_.isEqual(data, this.data) ) {
            this.data = _.cloneDeep(data);
            this._trigger('value', this.data);
            if( this.parent && _.isObject(this.parent.data) ) {
               this.parent._childChanged(this, this.data);
            }
            if(this.children) {
               _.each(this.children, function(child) {
                  child._dataChanged(extractChildData(child.name(), data));
               });
            }
         }
      },

      _defer: function(fn) {
         this.ops.push(Array.prototype.slice.call(arguments, 0));
         if( this.flushDelay !== false ) { this.flush(this.flushDelay); }
      },

      _trigger: function(event, data) {
         var snap = makeSnap(this, data);
         _.each(this._events[event], function(fn) {
            //todo allow scope by changing fn to an array? for use with on() and once() which accept scope?
            fn(snap);
         });
      },

      _nextErr: function(type) {
         var err = this.errs[type];
         delete this.errs[type];
         return err||null;
      }
   };

   function ref(path, autoSyncDelay) {
      var ref = new MockFirebase();
      ref.flushDelay = _.isUndefined(autoSyncDelay)? true : autoSyncDelay;
      if( path ) { ref = ref.child(path); }
      return ref;
   }

   function mergePaths(base, add) {
      return base.replace(/\/$/, '')+'/'+add.replace(/^\//, '');
   }

   function makeSnap(ref, data) {
      data = _.cloneDeep(data);
      return {
         val: function() { return data; },
         ref: function() { return ref; },
         name: function() { return ref.name() },
         forEach: function(cb, scope) {
            _.each(data, function(v, k, list) {
               var res = cb.call(scope, v, k, list);
               return !(res === true);
            });
         }
      }
   }

   function extractChildData(childName, data) {
      if( !_.isObject(data) || !_.hasKey(data, childName) ) {
         return null;
      }
      else {
         return data[childName];
      }
   }

   function extractName(path) {
      return ((path || '').match(/\/([^.$\[\]#\/]+)$/)||[null, null])[1];
   }

   var _, sinon;
   if( typeof module !== "undefined" && module.exports ) {
      module.exports = MockFirebase;
      _ = require('lodash');
      sinon = require('sinon');
   }
   else {
      window.MockFirebase = MockFirebase;
      _ = window._;
      sinon = window.sinon;
   }

   MockFirebase.stub = function(obj, key) {
      obj[key] = MockFirebase;
   };

   MockFirebase.ref = ref;
   MockFirebase.DEFAULT_DATA  = {
      'data': {
         'a': {
            hello: 'world',
            aNumber: 1,
            aBoolean: false
         },
         'b': {
            foo: 'bar',
            aNumber: 2,
            aBoolean: true
         }
      }
   };

})();