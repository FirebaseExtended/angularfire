angular.module('testx', ['firebase'])
  .value('mode', 'app')
  .value('version', 'v1.0.1');



describe("AngularFireAuth Test Suite", function() {

  var $firebase;
  var $firebaseSimpleLogin;
  var ngFireRef;
  var ngSimpleLogin;

  beforeEach(module("testx"));
  beforeEach(inject(function(_$firebase_, _$firebaseSimpleLogin_) {
    $firebase = _$firebase_;
    $firebaseSimpleLogin = _$firebaseSimpleLogin_;
    var ref = new Firebase("https://angularfiretests.firebaseio.com");
    ngFireRef = $firebase(ref);
    ngSimpleLogin = $firebaseSimpleLogin(ref);
  }));

  it("getUserInfo() is initially null.", function() {
    var done = false;
    ngSimpleLogin.$getCurrentUser().then(function(info) {
        done = true;
        expect(info).toBe(null);
    });

    waitsFor(function() { return done == true; }, "Getting current user info", 100);
  });


  it("contains spec with an expectation", function() {
    expect(true).toBe(true);
  });

});