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
      var ref = $firebase(new Firebase('Mock//sort').child('data').autoFlush());
      ref.$on('loaded', function() {
         loaded = true;
      });
      $timeout.flush();
      console.log(ref.$getIndex());
      var res = $filter('orderByPriority')(ref);
      expect(res).toEqual(_.map(Firebase.DEFAULT_DATA.data, function(v, k) {
         return _.isObject(v)? _.assign({'$id': k}, v) : v;
      }));
   });
});