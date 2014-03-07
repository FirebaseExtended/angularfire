describe('AngularFire', function () {
   var $firebase, $filter, $timeout;
   beforeEach(module('firebase'));
   beforeEach(inject(function (_$firebase_, _$filter_, _$timeout_) {
      $firebase = _$firebase_;
      $filter = _$filter_;
      $timeout = _$timeout_;
   }));

   describe('$on', function() {
      //todo loaded: called before load complete
      //todo loaded: called after load complete
      //todo loaded: called with null value

      describe("value", function() {
         it('should contain the correct event snapshot', function() {
           var fb = new Firebase('Mock://').child('data').autoFlush();
           var spy = jasmine.createSpy();
           $firebase(fb).$on('value', spy);
           $timeout.flush();
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
           $timeout.flush();
           expect(spy).toHaveBeenCalled();
         });

         it('should trigger if declared after data loads', function() {
           var fb = new Firebase('Mock://').child('data'), spy = jasmine.createSpy();
           var ref = $firebase(fb);
           fb.flush();
           ref.$on('value', spy);
           $timeout.flush();
           expect(spy).toHaveBeenCalled();
         });

         it('should trigger if data changes', function() {
           var fb = new Firebase('Mock://').child('data').autoFlush(), spy = jasmine.createSpy();
           $firebase(fb).$on('value', spy);
           $timeout.flush();
           fb.set('foo');
           $timeout.flush();
           expect(spy.callCount).toBe(2);
         });

         it('should not blow up if synced value is null', function() {
           var fb = new Firebase('EmptyMock://', null).autoFlush(), spy = jasmine.createSpy();
           $firebase(fb).$on('value', spy);
           $timeout.flush();
           fb.set('foo');
           $timeout.flush();
           expect(spy.callCount).toBe(2);
         });
      });

      //todo child_added
      //todo child_removed
      //todo child_moved
   });
});
