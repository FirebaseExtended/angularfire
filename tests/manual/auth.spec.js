angular.module('testx', ['firebase']);

describe("AngularFireAuth Test Suite", function() {

  var $firebase;
  var $firebaseSimpleLogin;
  var $timeout;
  var ngFireRef;
  var ngSimpleLogin;

  beforeEach(function() {
    if(ngFireRef == null) {
      module("testx")
      inject(function(_$firebase_, _$firebaseSimpleLogin_, _$timeout_) {
        $firebase = _$firebase_;
        $firebaseSimpleLogin = _$firebaseSimpleLogin_;
        $timeout = _$timeout_;
        var ref = new Firebase("https://angularfiretests.firebaseio.com");
        ngFireRef = $firebase(ref);
        ngSimpleLogin = $firebaseSimpleLogin(ref);
      });
    }
  });

  it("getUserInfo() triggers promise and is initially null.", function() {
    var done = false;
    ngSimpleLogin.$getCurrentUser().then(function(info) {
        done = true;
        expect(info).toBe(null);
    });

    waitsFor(function() {
      try {
        //We have to call this because the angular $timeout service is mocked for these tests.
        $timeout.flush();
      } catch(err) {}
      return done == true;
    }, "Getting current user info", 100);
  });


  it("contains spec with an expectation", function() {
    expect(true).toBe(true);
  });

});