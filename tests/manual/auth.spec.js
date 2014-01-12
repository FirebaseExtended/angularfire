describe("AngularFireAuth Test Suite", function() {

  it("getUserInfo() is initially null.", function() {
    inject(function($firebaseSimpleLogin) {
      expect($firebaseSimpleLogin.login).toBe(true);
    });

  });

  it("contains spec with an expectation", function() {
    expect(true).toBe(true);
  });

});