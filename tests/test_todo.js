
var system = require('system');

casper.test.comment('Testing TODO example with implicit sync angularFire');

casper.start('file://' + system.env['ROOTDIR'] + '/examples/todomvc/index.html', function() {
  this.test.assertTitle('AngularJS • TodoMVC');
});

casper.run(function() {
  this.test.done(1);
});
