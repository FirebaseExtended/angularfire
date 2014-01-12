angular.module('testx', ['firebase']);

describe("AngularFireAuth Test Suite", function() {

  //constants
  var existingUser = {
    email: "user@domain.com",
    password: "aaaaaaaa"
  }

  //globals
  var $firebase;
  var $firebaseSimpleLogin;
  var $timeout;
  var $rootScope;
  var ngFireRef;
  var ngSimpleLogin;

  function AsyncWaiter(events) {
    var eventsToComplete = events ? events : ["default"];

    this.done = function(event) {
      var theEvent = event ? event : "default";
      var ind = eventsToComplete.indexOf(theEvent);
      if(ind >= 0) {
        eventsToComplete.splice(ind, 1);
      }
    }

    this.wait = function(message, timeout) {
      waitsFor(function() {
        try {
          //We have to call this because the angular $timeout service is mocked for these tests.
          $timeout.flush();
        } catch(err) {}
        return eventsToComplete == 0;
      }, message, timeout ? timeout : 100);
    }
  }

  beforeEach(function() {
    if(ngFireRef == null) {
      module("testx")
      inject(function(_$firebase_, _$firebaseSimpleLogin_, _$timeout_, _$rootScope_) {
        $firebase = _$firebase_;
        $firebaseSimpleLogin = _$firebaseSimpleLogin_;
        $timeout = _$timeout_;
        $rootScope = _$rootScope_;
        var ref = new Firebase("https://angularfiretests.firebaseio.com");
        ngFireRef = $firebase(ref);
        ngSimpleLogin = $firebaseSimpleLogin(ref);
      });
    }
  });

  //We have this test first, to make sure that initial login state doesn't mess up the promise returned by
  //login.
  xit("Email: failed login", function() {
    var waiter = new AsyncWaiter(["future_failed", "error_event"]);

    var loginFuture = ngSimpleLogin.$login("password", {
      email: "someaccount@here.com",
      password: "sdkhfsdhkf"
    });

    //make sure the future fails.
    loginFuture.then(function() {
      expect(true).toBe(false); // we should never get here.
    }, function(err) {
      expect(err).not.toBe(null);
      waiter.done("future_failed");
    })

    //make sure an error event is broadcast on rootScope
    $rootScope.$on("$firebaseSimpleLogin:error", function(err) {
      expect(err).not.toBe(null);
      waiter.done("error_event");
    });

    waiter.wait("email login failure", 500);
  });

  xit("getUserInfo() triggers promise and is initially null.", function() {
    var waiter = new AsyncWaiter();

    ngSimpleLogin.$getCurrentUser().then(function(info) {
      expect(info).toBe(null);
      waiter.done();
    });

    waiter.wait("get user info from promise", 100);
  });

  xit("Failed Facebook login", function() {
    var waiter = new AsyncWaiter(["future_failed", "error_event"]);

    var loginFuture = ngSimpleLogin.$login("facebook");

    //verify that the future throws an error
    loginFuture.then(function() {
      expect(true).toBe(false); // we should never get here.
    }, function(err) {
      expect(err).not.toBe(null);
      waiter.done("future_failed");
    })

    //verify that an error event is triggered on the root scope
    $rootScope.$on("$firebaseSimpleLogin:error", function(err) {
      expect(err).not.toBe(null);
      waiter.done("error_event");
    });

    waiter.wait("login to complete", 15000);
  });

  xit("Successful Twitter login", function() {
    var waiter = new AsyncWaiter(["user_info", "login_event"]);

    var loginFuture = ngSimpleLogin.$login("twitter");

    //verify that the future throws an error
    loginFuture.then(function(user) {
      expect(user).not.toBe(null);
      waiter.done("user_info");
    }, function(err) {
      //die
      expect(true).toBe(false);
    });

    //verify that a login event is triggered on the root scope
    $rootScope.$on("$firebaseSimpleLogin:login", function(user) {
      expect(user).not.toBe(null);
      waiter.done("login_event");
    });

    waiter.wait("login failure to occur", 15000);
  });

  it("Email: login", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  it("Email: failed account creation", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  it("Email: account account creation", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  it("Email: failed change password", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  it("getCurrentUser for logged-in state", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  it("Email: change password", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  it("user model object is accurate", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  it("Email: remove user", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  xit("Logout", function() {
    var waiter = new AsyncWaiter(["future", "event"]);

    ngSimpleLogin.$logout();

    //Verify that the user is immediately logged out.
    var future = ngSimpleLogin.$getCurrentUser();
    future.then(function(user) {
      expect(user).toBe(null);
      waiter.done("future");
    })

    //verify that a logout event is triggered on the root scope
    $rootScope.$on("$firebaseSimpleLogin:logout", function() {
      waiter.done("event");
    });


    waiter.wait("get user info after logout", 1000);
  });

});