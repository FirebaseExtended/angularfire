describe('AngularFire', function () {
   var $firebase, $filter, $timeout;
   beforeEach(module('firebase'));
   beforeEach(inject(function (_$firebase_, _$filter_, _$timeout_) {
      $firebase = _$firebase_;
      $filter = _$filter_;
      $timeout = _$timeout_;
   }));

   describe('$on', function() {
      describe("loaded", function() {
        it('should give the current value', function() {
          var fb = new Firebase('Mock://').child('data').autoFlush();
          var spy = jasmine.createSpy();
          $firebase(fb).$on('loaded', spy);
          flush();
          expect(spy).toHaveBeenCalledWith(fb.getData());
        });

        it('should trigger if declared before data loads', function() {
          var fb = new Firebase('Mock://').child('data');
          var spy = jasmine.createSpy();
          $firebase(fb).$on('loaded', spy);
          flush(fb);
          expect(spy).toHaveBeenCalled();
        });

        it('$getIndex() should work inside loaded function (#262)', function() {
          var fb = new Firebase('Mock://').child('data');
          var called = false;
          var ref = $firebase(fb).$on('loaded', function(data) {
            called = true;
            // this assertion must be inside the callback
            expect(ref.$getIndex()).toEqual(Firebase._.keys(data));
          });
          flush(fb);
          expect(called).toBe(true);
        });

        it('should have a snapshot if declared after data loads (#265)', function() {
          var fb = new Firebase('Mock://').child('data');
          var spy = jasmine.createSpy();
          var ref = $firebase(fb);
          fb.flush();
          ref.$on('loaded', spy);
          flush();
          expect(spy.mostRecentCall.args[0]).not.toBeNull();
        });

        it("should only trigger once", function() {
          var fb = new Firebase('Mock://').child('data').autoFlush();
          var spy = jasmine.createSpy();
          var ref = $firebase(fb);
          ref.$on('loaded', spy);
          flush();
          fb.set('foo');
          flush();
          expect(spy.callCount).toBe(1);
        });

        it('should allow $bind within the loaded callback (#260)', inject(function($rootScope) {
          var $scope = $rootScope.$new();
          var fb = new Firebase('Mock://').child('data');
          var called = false;
          var ref = $firebase(fb).$on('loaded', function(data) {
            called = true;
            ref.$bind($scope, 'test');
            // these assertions must be inside the callback
            expect(ref.$getIndex().length).toBeGreaterThan(0);
            expect(ref.$getIndex()).toEqual($scope.test.$getIndex());
          });
          flush(fb);
          expect(called).toBe(true);
        }));
      });

      describe("value", function() {
         it('should contain the correct event snapshot (#267)', function() {
           var fb = new Firebase('Mock://').child('data').autoFlush();
           var spy = jasmine.createSpy();
           $firebase(fb).$on('value', spy);
           flush();
           expect(spy).toHaveBeenCalledWith({
             snapshot: {
               name: 'data',
               value: fb.getData()
             },
             prevChild: null
           });
         });

         it('should trigger if declared before data loads', function() {
           var fb = new Firebase('Mock://').child('data'), spy = jasmine.createSpy();
           $firebase(fb).$on('value', spy);
           fb.flush();
           flush();
           expect(spy).toHaveBeenCalled();
         });

         it('should trigger if declared after data loads', function() {
           var fb = new Firebase('Mock://').child('data'), spy = jasmine.createSpy();
           var ref = $firebase(fb);
           fb.flush();
           ref.$on('value', spy);
           flush();
           expect(spy).toHaveBeenCalled();
         });

         it('should trigger if data changes', function() {
           var fb = new Firebase('Mock://').child('data').autoFlush(), spy = jasmine.createSpy();
           $firebase(fb).$on('value', spy);
           flush();
           fb.set('foo');
           flush();
           expect(spy.callCount).toBe(2);
         });

         it('should not blow up if synced value is null', function() {
           var fb = new Firebase('EmptyMock://', null).autoFlush(), spy = jasmine.createSpy();
           $firebase(fb).$on('value', spy);
           flush();
           fb.set('foo');
           flush();
           expect(spy.callCount).toBe(2);
         });
      });

      //todo child_added
      //todo child_removed
      //todo child_moved
   });

  // flush blows up if you call it and no items are queued, however, we often need to make sure
  // $timeout hasn't been called so this is simpler than guessing how many times the internal
  // code may call $timeout and trying to make sure we account for them; just call it and ignore
  // the error; also flush fb if passed in
  function flush(fb) {
    fb && fb.flush();
    try {
      $timeout.flush();
    }
    catch(e) {}
  }
});
