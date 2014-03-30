describe('OrderByPriority Filter', function () {
   var $firebase, $filter, $timeout;
   beforeEach(module('firebase'));
   beforeEach(inject(function (_$firebase_, _$filter_, _$timeout_) {
      $firebase = _$firebase_;
      $filter = _$filter_;
      $timeout = _$timeout_;
   }));

   it('should return a copy if passed an array', function () {
      var orig = ['a', 'b', 'c'];
      var res = $filter('orderByPriority')(orig);
      expect(res).not.toBe(orig); // is a copy
      expect(res).toEqual(orig); // is the same
   });

   it('should return an equivalent array if passed an object', function () {
      var res = $filter('orderByPriority')({foo: 'bar', fu: 'baz'});
      expect(res).toEqual(['bar', 'baz']);
   });

   it('should return an empty array if passed a non-object', function () {
      var res = $filter('orderByPriority')(true);
      expect(res).toEqual([]);
   });

   it('should return an array from a $firebase instance', function () {
      var loaded = false;
      // autoFlush makes all Firebase methods trigger immediately
      var fb = new Firebase('Mock//sort').child('data').autoFlush();
      var ref = $firebase(fb);
      // $timeout is a mock, so we have to tell the mock when to trigger it
      // and fire all the angularFire events
      $timeout.flush();
      // now we can actually trigger our filter and pass in the $firebase ref
      var res = $filter('orderByPriority')(ref);
      // and finally test the results against the original data in Firebase instance
      var originalData = _.map(fb.getData(), function(v, k) {
         return _.isObject(v)? _.assign({'$id': k}, v) : v;
      });
      expect(res).toEqual(originalData);
   });

   it('should return an array from a $firebase instance array', function () {
      var loaded = false;
      // autoFlush makes all Firebase methods trigger immediately
      var fb = new Firebase('Mock//sort', 
        {data: {'0': 'foo', '1': 'bar'}}
      ).child('data').autoFlush();
      var ref = $firebase(fb);
      // $timeout is a mock, so we have to tell the mock when to trigger it
      // and fire all the angularFire events
      $timeout.flush();
      // now we can actually trigger our filter and pass in the $firebase ref
      var res = $filter('orderByPriority')(ref);
      // and finally test the results against the original data in Firebase instance
      var originalData = _.map(fb.getData(), function(v, k) {
         return _.isObject(v)? _.assign({'$id': k}, v) : v;
      });
      expect(res).toEqual(originalData);
   });

});