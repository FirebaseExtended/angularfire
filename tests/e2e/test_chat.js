
casper.test.comment("Testing Chat example with $firebase");

casper.start("tests/e2e/test_chat.html", function() {
  // Sanity test for the environment.
  this.test.assertTitle("AngularFire Chat Test");
  this.test.assertEval(function() {
    if (!Firebase) return false;
    if (!_scope) return false;
    return true;
  }, "Firebase exists");
});

casper.thenEvaluate(function() {
  // Clean up Firebase to start fresh test.
  var fbRef = new Firebase(_url);
  var fbTnRef = new Firebase(_tnUrl);
  fbRef.set(null, function(err) {
    window.__flag = true;
  });
  fbTnRef.set(null, function(err) {});
});

casper.waitFor(function() {
  return this.getGlobal("__flag") === true;
});

casper.then(function() {
  var _testName = "TestGuest";
  var _testMessage = "This is a test message";
  var _testCountMessage = 1;

  this.test.assertEval(function(params) {
    _scope.username = params[0];
    _scope.message = params[1];
    _scope.addMessage();
    return _scope.message == "";
  }, "Adding a new message", [_testName, _testMessage]);

  this.waitForSelector(".messageBlock", function() {
    this.test.assertEval(function(params) {
      return testIfInDOM(
        params[0], params[1], document.querySelector(".messageBlock")
      );
    }, "Testing if message is in the DOM", [_testName, _testMessage]);
  });

  this.waitForSelector(".messageCountBlock", function() {
    this.test.assertEval(function(params) {
      return testMessageCount(
        params[0], document.querySelector(".messageCountBlock")
      );
    }, "Testing if message count is in the DOM", [_testCountMessage]);
  });

});

casper.then(function() {
  var _testName = "GuestTest";
  var _testMessage = "This is another test message";

  this.evaluate(function(params) {
    window.__flag = false;
    var ref = new Firebase(_url);
    ref.push({from: params[0], content: params[1]}, function(err) {
      window.__flag = true;
    });
  }, [_testName, _testMessage]);

  this.waitFor(function() {
    return this.getGlobal("__flag") === true;
  }, function() {
    this.test.assertEval(function(params) {
      var msgs = document.querySelectorAll(".messageBlock");
      if (msgs.length != 2) {
        return false;
      }
      return testIfInDOM(params[0], params[1], msgs[1]);
    }, "Testing if remote message is in the DOM", [_testName, _testMessage]);
  });
});

casper.then(function() {
  this.test.assertEval(function() {
    _scope.message = "Limit Test";
    _scope.addMessage();

    var ref = new Firebase(_url);
    ref.once("value", function(snapshot) {
      window.__flag = snapshot.val();
    });

    return _scope.message == "";
  }, "Adding limit message");

  this.waitFor(function() {
    return this.getGlobal("__flag") !== true;
  }, function() {
    this.test.assertEval(function() {
      var msgs = document.querySelectorAll(".messageBlock");
      return msgs.length === 2;
    }, "Testing if limits and queries work");
 });
});

casper.then(function() {
  this.test.assertEval(function() {
    _scope.message = "Testing add promise";
    var promise = _scope.addMessage();
    if (typeof promise.then != "function") return false;
    promise = _scope.messages.$set({foo: "bar"});
    if (typeof promise.then != "function") return false;
    promise = _scope.messages.$save();
    if (typeof promise.then != "function") return false;
    promise = _scope.messages.$remove();
    if (typeof promise.then != "function") return false;
    return true;
  }, "Testing if $add, $set, $save and $remove return a promise");
});

casper.then(function() {
  this.test.assertEval(function() {
    _scope.message = "Testing $id value";

    var id = _scope.messages.$id;
    var fbRef = new Firebase(_url);

    if(id === fbRef.name()) { return true; }
    return false;
  }, "Testing if $id resolves to firebaseRef.name()");
});

casper.run(function() {
  this.test.done();
});
