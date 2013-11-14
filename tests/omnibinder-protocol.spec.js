describe('OmniBinder Protocol', function () {
  var firebinder;

  beforeEach(module('omniFire'))
  beforeEach(inject(function (_firebinder_) {
    firebinder = _firebinder_;
  }));


  it('should have a property called bar', function () {
    expect(typeof firebinder.subscribe).toBe('function');
  });
});
