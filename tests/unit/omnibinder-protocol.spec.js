describe('OmniBinder Protocol', function () {
  var firebinder;

  beforeEach(module('omniFire'))
  beforeEach(inject(function (_firebinder_) {
    firebinder = _firebinder_;
  }));


  it('should have a property called bar', function () {
    expect(typeof firebinder.subscribe).toBe('function');
  });

  describe('subscribe', function () {
    it('should create a new Firebase instance for the given location', function () {
      var binder = {query: {url: 'foo/bar/'}};
      var spy = spyOn(window, 'Firebase').andCallThrough()

      firebinder.subscribe(binder);
      expect(spy).toHaveBeenCalledWith('foo/bar/');
    });


    it('should call limit if provided in query', function () {
      var binder = {query: {limit: 10, url: 'foo/bar'}};
      firebinder.subscribe(binder);
      expect(binder.fbRef._limit).toBe(10);
    });


    it('should call startAt if provided in query', function () {
      var binder = {query: {limit: 20, startAt: 50, url: 'foo/bar'}};
      firebinder.subscribe(binder);
      expect(binder.fbRef._limit).toBe(20);
      expect(binder.fbRef._startAt).toBe(50);
    });


    describe('child_added', function () {
      var binder;
      beforeEach(function (){
        binder = {query: {url: 'foo/bar'}};
      });


      it('should call on child_added on the ref during construction',
        function () {
          firebinder.subscribe(binder);
          expect(typeof binder.fbRef._events['child_added']).toBeDefined();
        });


      it('should call onChildAdded on the event of the child being added',
        function () {
          var spy = spyOn(firebinder, 'onChildAdded');

          firebinder.subscribe(binder);
          binder.fbRef._events['child_added']();

          expect(spy).toHaveBeenCalled();
        });

      it('should insert the child\'s name at the end of the binder index if no prev is provided',
        function () {
          firebinder.subscribe(binder);
          binder.index.push('baz', 'foo');
          firebinder.onChildAdded.call(firebinder, binder, {val: 'foo', name: function () {
            return 'bar';
          }});

          expect(binder.index.indexOf('bar')).toBe(2);
        });

      it('should insert the child\'s name after the prev in the binder index',
        function () {
          firebinder.subscribe(binder);
          binder.index.push('baz', 'foo');
          firebinder.onChildAdded.call(firebinder, binder, {val: 'foo', name: function () {
            return 'bar';
          }}, 'baz');

          expect(binder.index.indexOf('bar')).toBe(1);
        });
    });
  })
});
