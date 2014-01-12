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
    var off = $rootScope.$on("$firebaseSimpleLogin:error", function(event, err) {
      expect(err).not.toBe(null);
      waiter.done("error_event");
      off();
    });


    waiter.wait("email login failure", 500);
  });

  //Ensure that getUserInfo gives us a null if we're logged out.
  xit("getUserInfo() triggers promise and is initially null.", function() {
    var waiter = new AsyncWaiter();

    ngSimpleLogin.$getCurrentUser().then(function(info) {
      expect(info).toBe(null);
      waiter.done();
    });

    waiter.wait("get user info from promise", 100);
  });

  //Make sure logins to providers we haven't enabled fail.
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
      });
    });

    waiter.wait("email login success", 2000);
  });

  //Check to make sure logout works.
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
    var off = $rootScope.$on("$firebaseSimpleLogin:logout", function(event) {
      waiter.done("event");
      off();
    });

    waiter.wait("get user info after logout", 2000);
  });

  //Ensure we properly handle errors on account creation.
  xit("Email: failed account creation", function() {
    var waiter = new AsyncWaiter(["promise", "event"]);

    var promise = ngSimpleLogin.$createUser(existingUser.email, "xaaa");
    promise.then(function(user) {
      expect(false).toBe(true); // die
    }, function(err) {
      expect(err.code).toBe('EMAIL_TAKEN');
      waiter.done("promise");
    })

    //verify that a logout event is triggered on the root scope
    var off = $rootScope.$on("$firebaseSimpleLogin:error", function(event, err) {
      expect(err).not.toBe(null);
      waiter.done("event");
      off();
    });

    waiter.wait("failed account creation", 2000);
  });

  //Handle the noLogin flag correctly.
  xit("Email: account creation noLogin", function() {
    var waiter = new AsyncWaiter(["promise", "getuser"]);

    var accountEmail = "a" + Math.round(Math.random()*10000000000) + "@email.com";

    var promise = ngSimpleLogin.$createUser(accountEmail, "aaa", true);
    promise.then(function(user) {
      expect(user.email).toBe(accountEmail);
      waiter.done("promise");
    }, function(err) {
      expect(false).toBe(true); //die
    })

    //lets ensure we didn't get logged in.
    ngSimpleLogin.$getCurrentUser().then(function(user) {
      expect(user).toBe(null);
      waiter.done("getuser");
    });

    waiter.wait("account creation with noLogin", 15000);
  });

  //Test account creation.
  xit("Email: account creation", function() {
    var waiter = new AsyncWaiter(["promise", "event", "getuser"]);

    var accountEmail = "a" + Math.round(Math.random()*10000000000) + "@email.com";

    var promise = ngSimpleLogin.$createUser(accountEmail, "aaa");
    promise.then(function(user) {
      expect(user.email).toBe(accountEmail);
      waiter.done("promise");
    }, function(err) {
      expect(false).toBe(true); //die
    })

    //make sure a logout event fired. Wrap it so we don't get the initial login event.
    ngSimpleLogin.$getCurrentUser().then(function() {
      var off = $rootScope.$on("$firebaseSimpleLogin:login", function(event, user) {
        expect(user.email).toBe(accountEmail);
        waiter.done("event");
        off();

        //now make sure if we get the user info it's correct
        ngSimpleLogin.$getCurrentUser().then(function(user2) {
          expect(user2.email).toBe(accountEmail);
          waiter.done("getuser");
        });
      });
    });

    waiter.wait("account creation", 15000);
  });

  xit("Email: failed change password", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  xit("getCurrentUser for logged-in state", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  xit("Email: change password", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  xit("user model object is accurate", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });

  xit("Email: remove user", function() {
    var waiter = new AsyncWaiter();

    //waiter.wait("xxx", 15000);
  });
});