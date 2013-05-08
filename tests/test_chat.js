
var system = require('system');

casper.test.comment('Testing Chat example with angularFireCollection');

casper.start('file://' + system.env['ROOTDIR'] + '/examples/chat/index.html', function() {
  this.test.assertTitle('AngularFire Chat Demo');
});

casper.run(function() {
  this.test.done(1);
});
