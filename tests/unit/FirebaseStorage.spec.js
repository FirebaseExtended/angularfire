'use strict';
describe('$firebaseStorage', function () {
  var $firebaseStorage;
  var URL = 'https://angularfire-dae2e.firebaseio.com';

  function MockTask(interval, limit) {
    var self = this;
    self.interval = interval || 1;
    self.limit = limit || 4;
    self.progress = null;
    self.error = null;
    self.complete = null;

    self.snapshot = {
      bytesTransferred: 0,
      downloadURL: 'url',
      metadata: {},
      ref: {},
      state: {},
      task: {},
      totalBytes: 0
    };

    self.causeProgress = function () {
      var count = 0;
      var intervalId = setInterval(function () {
        self.progress(self.snapshot);
        count = count + 1;
        if (count === self.limit) {
          clearInterval(intervalId);
          self.complete(self.snapshot);
        }
      }, self.interval);
    };

    self.causeError = function () {
      self.error(new Error('boom'));    
    };
  }

  function MockSuccessTask(interval, limit) {
    var self = this;
    self._init = false;
    MockTask.apply(this, interval, limit);
    self.on = function (event, progress, error, complete) {
      if (self._init === false) {
        self.progress = progress;
        self.error = error;
        self.complete = complete;
        self._init = true;
        self.causeProgress();
      }
    };
  }

  function MockErrorTask(interval, limit) {
    var self = this;
    MockTask.apply(this, interval, limit);
    self.on = function (event, progress, error, complete) {
      self.progress = progress;
      self.error = error;
      self.complete = complete;
      self.causeError();
    };    
  }

  beforeEach(function () {
    module('firebase.storage')
  });

  describe('<constructor>', function() {

    var $firebaseStorage;
    beforeEach(function() {
      module('firebase.storage');
      inject(function (_$firebaseStorage_) {
        $firebaseStorage = _$firebaseStorage_;
      });
    });

    it('should exist', inject(function() {
      expect($firebaseStorage).not.toBe(null);
    }));

    it('should create an instance', function() {
      const ref = firebase.storage().ref('thing');
      const storage = $firebaseStorage(ref);
      expect(storage).not.toBe(null);
    });

    fdescribe('$firebaseStorage.utils', function() {

      describe('_unwrapStorageSnapshot', function() {

        it('should unwrap the snapshot', function() {
          var mockSnapshot = {
            bytesTransferred: 0,
            downloadURL: 'url',
            metadata: {},
            ref: {},
            state: {},
            task: {},
            totalBytes: 0
          };
          var unwrapped = $firebaseStorage.utils._unwrapStorageSnapshot(mockSnapshot);
          expect(mockSnapshot).toEqual(unwrapped);
        });

      });

      describe('_$put', function() {
        
        it('should call a storage ref put', function() {
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var storage = $firebaseStorage(ref);
          var task = null;
          spyOn(ref, 'put');
          task = storage.$put(file);
          expect(ref.put).toHaveBeenCalledWith('file');
          expect(task.$progress).toEqual(jasmine.any(Function));
          expect(task.$error).toEqual(jasmine.any(Function));
          expect(task.$complete).toEqual(jasmine.any(Function));
        });

        it('should return the observer functions', function() {
          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var storage = $firebaseStorage(ref);
          var task = null;
          spyOn(ref, 'put');
          task = storage.$put(file);
          expect(task.$progress).toEqual(jasmine.any(Function));
          expect(task.$error).toEqual(jasmine.any(Function));
          expect(task.$complete).toEqual(jasmine.any(Function));          
        });

        it('should call the progress callback function', function(done) {

          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var storage = $firebaseStorage(ref);
          var task = null;
          var didCallProgress = false;

          spyOn(ref, "put").and.returnValue(new MockSuccessTask());
          task = storage.$put(file);

          task.$progress(function(snap) {
            didCallProgress = true;
            expect(didCallProgress).toBeTruthy();
            done();
          });

        });

        it('should call the error callback function', function(done) {

          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var storage = $firebaseStorage(ref);
          var task = null;
          var didCallError = false;

          spyOn(ref, "put").and.returnValue(new MockErrorTask());
          task = storage.$put(file);

          task.$error(function(err) {
            didCallError = true;
            expect(didCallError).toBeTruthy();
            done();
          });

        });  

        it('should call the complete callback function', function(done) {

          var ref = firebase.storage().ref('thing');
          var file = 'file';
          var storage = $firebaseStorage(ref);
          var task = null;
          var didCallComplete = false;

          spyOn(ref, "put").and.returnValue(new MockSuccessTask());
          task = storage.$put(file);

          task.$complete(function() {
            didCallComplete = true;
            expect(didCallComplete).toBeTruthy();   
            done();
          });
        });              

      });

      describe('_$getDownloadURL', function() {
        
      });

      describe('_isStorageRef', function() {
        
      });

      describe('_assertStorageRef', function() {
        
      });

    });

  });
});
