
var system = require('system');

casper.test.comment('Testing Chat example with angularFireCollection');

casper.start('tests/test_chat.html', function() {
  this.test.assertTitle('AngularFire Chat Demo');
  this.test.assertEval(function() {
    return AngularFire ? true : false;
  }, "AngularFire exists");
  this.test.assertEval(function() {
    return testModule ? true : false;
  }, "Test module exists");
});

casper.then(function(params) {
  var _testName = "TestGuest";
  var _testMessage = "This is a test message";
  this.test.assertEval(function(params) {
    testModule.addMessage(params[0], params[1]);
    return true;
  }, "Adding a new message", [_testName, _testMessage]);
});

casper.run(function() {
  this.test.done(4);
});
