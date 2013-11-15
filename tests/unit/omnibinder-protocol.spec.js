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
      var binder = {query: {limit: 10}};
      firebinder.subscribe(binder);
      expect(binder.fbRef._limit).toBe(10);
    });


    it('should call startAt if provided in query', function () {
      var binder = {query: {limit: 20, startAt: 50}};
      firebinder.subscribe(binder);
      expect(binder.fbRef._limit).toBe(20);
      expect(binder.fbRef._startAt).toBe(50);
    });
  })
});
