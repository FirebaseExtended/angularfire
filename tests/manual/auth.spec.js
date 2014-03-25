angular.module('testx', ['firebase']);

describe("AngularFireAuth Test Suite", function() {

  //constants
  var existingUser = {
    email: "user@domain.com",
    password: "aaaaaaaa"
  }
  var newUserInf = {
    email: "a" + Math.round(Math.random()*10000000000) + "@email.com",
    password: "Pw",
    newPW: "sdljf"
  };

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
      }, message, timeout ? timeout : 2000);
    }
  }

  beforeEach(function() {
    //do some initial setup
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

        //make sure we start logged-out.
        ngSimpleLogin.$logout();
      });
    }
  });

  //We have this test first, to make sure that initial login state doesn't mess up the promise returned by
  //login.
  it("Email: failed login", function() {
    var waiter = new AsyncWaiter(["future_failed", "error_event"]);

    var loginFuture = ngSimpleLogin.$login("password", {
      email: "someaccount@here.com",
      password: "sdkhfsdhkf"
    });

    //make sure the future fails.
    loginFuture.then(function(user) {
      expect(true).toBe(false); // we should never get here.
    }, function(err) {
      expect(err).not.toBe(null);
      waiter.done("future_failed");
    })

    //make sure an error event is broadcast on rootScope
    var off = $rootScope.$on("$firebaseSimpleLogin:error", function(event, err) {
      expect(err).not.toBe(null);
      waiter.done("error_event");
      off();
    });

    waiter.wait("email login failure");
  });

  //Ensure that getUserInfo gives us a null if we're logged out.
  it("getUserInfo() triggers promise and is initially null.", function() {
    var waiter = new AsyncWaiter();

    ngSimpleLogin.$getCurrentUser().then(function(info) {
      expect(info).toBe(null);
      waiter.done();
    });

    waiter.wait("get user info from promise");
  });

  //Make sure logins to providers we haven't enabled fail.
  it("Failed Facebook login", function() {
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
    var off = $rootScope.$on("$firebaseSimpleLogin:error", function(event, err) {
      expect(err).not.toBe(null);
      waiter.done("error_event");
      off();
    });

    waiter.wait("login to complete", 15000);
  });

  //Login successfully to a twitter account
  it("Successful Twitter login", function() {
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

    //verify that a login event is triggered on the root scope. Wrap it so that we don't see events for initial state.
    ngSimpleLogin.$getCurrentUser().then(function() {
      var off = $rootScope.$on("$firebaseSimpleLogin:login", function(event, user) {
        expect(user).not.toBe(null);
        waiter.done("login_event");
        off();
      });
    });

    waiter.wait("login failure to occur", 15000);
  });

  //Check that email login works
  it("Email: login", function() {
    var waiter = new AsyncWaiter(["future_success", "login_event"]);

    var loginFuture = ngSimpleLogin.$login("password", existingUser);

    //make sure the future succeeds.
    loginFuture.then(function(user) {
      expect(user.email).toBe(existingUser.email);
      waiter.done("future_success");
    }, function(err) {
      expect(false).toBe(true); //die
    })

    //make sure an error event is broadcast on rootScope. Wrap it so that we don't see events for initial state.
    ngSimpleLogin.$getCurrentUser().then(function() {
      var off = $rootScope.$on("$firebaseSimpleLogin:login", function(event, user) {
        expect(user.email).toBe(existingUser.email);
        waiter.done("login_event");
        off();

        //now check that the user model has actually been updated
        expect(ngSimpleLogin.user.email).toBe(existingUser.email);
      });
    });

    waiter.wait("email login success");
  });

  it("getCurrentUser for logged-in state", function() {
    var waiter = new AsyncWaiter();

    var promise = ngSimpleLogin.$getCurrentUser();
    promise.then(function(user) {
      expect(user.email).toBe(existingUser.email);
      waiter.done();
    })

    waiter.wait("getting user info");
  });

  //Check to make sure logout works.
  it("Logout", function() {
    var waiter = new AsyncWaiter(["future", "event"]);

    ngSimpleLogin.$logout();

    //Verify that the user is immediately logged out.
    var future = ngSimpleLogin.$getCurrentUser();
    future.then(function(user) {
      expect(user).toBe(null);
      waiter.done("future");
    })

    //verify that a logout event is triggered on the root scope
    var off = $rootScope.$on("$firebaseSimpleLogin:logout", function(event) {
      waiter.done("event");
      off();
    });

    waiter.wait("get user info after logout");
  });

  //Ensure we properly handle errors on account creation.
  it("Email: failed account creation", function() {
    var waiter = new AsyncWaiter(["promise", "event"]);

    var promise = ngSimpleLogin.$createUser(existingUser.email, "xaaa");
    promise.then(function(user) {
      expect(false).toBe(true); // die
    }, function(err) {
      expect(err.code).toBe('EMAIL_TAKEN');
      waiter.done("promise");
    })

    var off = $rootScope.$on("$firebaseSimpleLogin:error", function(event, err) {
      expect(err).not.toBe(null);
      waiter.done("event");
      off();
    });

    waiter.wait("failed account creation");
  });

  //Test account creation.
  it("Email: account creation", function() {
    var waiter = new AsyncWaiter(["promise", "getuser"]);

    var accountEmail = "a" + Math.round(Math.random()*10000000000) + "@email.com";

    var promise = ngSimpleLogin.$createUser(accountEmail, "aaa");
    promise.then(function(user) {
      expect(user.email).toBe(accountEmail);
      waiter.done("promise");
    }, function(err) {
      expect(false).toBe(true); //die
    });

    //lets ensure we didn't get logged in.
    ngSimpleLogin.$getCurrentUser().then(function(user) {
      expect(user).toBe(null);
      waiter.done("getuser");
    });

    waiter.wait("account creation with noLogin", 1600);
  });

  //Test logging into newly created user.
  it("Email: account creation with subsequent login", function() {
    var waiter = new AsyncWaiter(["promise", "login"]);
    var promise = ngSimpleLogin.$createUser(newUserInf.email, newUserInf.password);
    promise.then(function(user) {
      expect(user.email).toBe(newUserInf.email);
      waiter.done("promise");
      ngSimpleLogin.$login("password", newUserInf).then(function(user2) {
        expect(user2.email).toBe(newUserInf.email);
        waiter.done("login");
      }, function(err) {
        expect(false).toBe(true);
      });
    }, function(err) {
      expect(false).toBe(true); //die
    });
    waiter.wait("account creation", 2000);
  });


  it("Email: failed change password", function() {
    var waiter = new AsyncWaiter(["promise", "event"]);

    var promise = ngSimpleLogin.$changePassword(existingUser.email, "pxz", "sdf");
    promise.then(function() {
      expect(false).toBe(true); //die
    }, function(err) {
      expect(err).not.toBe(null);
      waiter.done("promise");
    })

    var off = $rootScope.$on("$firebaseSimpleLogin:error", function(event, err) {
      expect(err).not.toBe(null);
      waiter.done("event");
      off();
    });

    waiter.wait("failed change password", 2000);
  });

  it("Email: change password", function() {
    var waiter = new AsyncWaiter(["fail", "succeed"]);

    //this should fail
    ngSimpleLogin.$changePassword(newUserInf.email, "88dfhjgerqwqq", newUserInf.newPW).then(function(user) {
      expect(true).toBe(false); //die
    }, function(err) {
      waiter.done("fail");
      expect(err.code).toBe('INVALID_PASSWORD');

    });

    //this should succeed
    var promise = ngSimpleLogin.$changePassword(newUserInf.email, newUserInf.password, newUserInf.newPW);
    promise.then(function() {
      expect(true).toBe(true);
      waiter.done("succeed");
    }, function(err) {
      expect(true).toBe(false); //die
    });

    waiter.wait("change password", 2000);
  });

  it("Email: remove user", function() {
    var waiter = new AsyncWaiter(["fail", "success"]);

    ngSimpleLogin.$removeUser(newUserInf.email + "x", newUserInf.newPW).then(function() {
      expect(true).toBe(false); //die
    }, function(err) {
      //this one doesn't exist, so it should fail
      expect(err).not.toBe(null);
      waiter.done("fail");
    });

    ngSimpleLogin.$removeUser(newUserInf.email, newUserInf.newPW).then(function() {
      waiter.done("success");

      //TODO: this test should prob work, but we need to make Simple Login support this first
      //now make sure we've been logged out if we removed our own account
      //ngSimpleLogin.$getCurrentUser().then(function(user) {
      //  expect(user).toBe(null);
      //  waiter.done("check");
      //});
    }, function(err) {
      expect(true).toBe(false); //die
    });

    waiter.wait("removeuser fail and success");
  });

  it("Email: reset password", function() {
    var waiter = new AsyncWaiter(["fail", "success"]);

    ngSimpleLogin.$sendPasswordResetEmail("invalidemailaddress@example.org").then(function() {
      expect(true).toBe(false);
    }, function(err) {
      expect(err).not.toBe(null);
      waiter.done("fail");
    });

    ngSimpleLogin.$sendPasswordResetEmail("angularfiretests@mailinator.com").then(function() {
      waiter.done("success");
    }, function(err) {
      expect(true).toBe(false);
    });

    waiter.wait("resetpassword fail and success");
  });
});
