var protractor = require('protractor');
var Firebase = require('firebase');

describe('Priority App', function () {
  // Reference to the message repeater
  var messages = element.all(by.repeater('message in messages'));

  // Reference to the Firebase which stores the data for this demo
  var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/priority');

  // Boolean used to clear the Firebase on the first test only
  var firebaseCleared = false;

  beforeEach(function () {
    var flow = protractor.promise.controlFlow();

    if( !firebaseCleared ) {
      firebaseCleared = true;
      flow.execute(purge);
    }

    // Navigate to the priority app
    browser.get('priority/priority.html');

    // Wait for all data to load into the client
    flow.execute(waitForData);

    function purge() {
      var def = protractor.promise.defer();
      firebaseRef.remove(function(err) {
        if( err ) { def.reject(err); }
        else { def.fulfill(true); }
      });
      return def.promise;
    }

    function waitForData() {
      var def = protractor.promise.defer();
      firebaseRef.once('value', function() {
        def.fulfill(true);
      });
      return def.promise;
    }
  });

  afterEach(function() {
    firebaseRef.off();
  });

  it('loads', function () {
  });

  it('has the correct title', function () {
    expect(browser.getTitle()).toEqual('AngularFire Priority e2e Test');
  });

  it('starts with an empty list of messages', function () {
    // Make sure the page has no messages
    expect(messages.count()).toBe(0);
  });

  it('adds new messages with the correct priority', function () {
    // Add three new messages by typing into the input and pressing enter
    var newMessageInput = element(by.model('message'));
    newMessageInput.sendKeys('Hey there!\n');
    newMessageInput.sendKeys('Oh, hi. How are you?\n');
    newMessageInput.sendKeys('Pretty fantastic!\n');

    // Make sure the page has three messages
    expect(messages.count()).toBe(3);

    // Make sure the priority of each message is correct
    expect($('.message:nth-of-type(1) .priority').getText()).toEqual('0');
    expect($('.message:nth-of-type(2) .priority').getText()).toEqual('1');
    expect($('.message:nth-of-type(3) .priority').getText()).toEqual('2');

    // Make sure the content of each message is correct
    expect($('.message:nth-of-type(1) .content').getText()).toEqual('Hey there!');
    expect($('.message:nth-of-type(2) .content').getText()).toEqual('Oh, hi. How are you?');
    expect($('.message:nth-of-type(3) .content').getText()).toEqual('Pretty fantastic!');
  });

  it('responds to external priority updates', function () {
    var movesDone = waitForMoveEvents();
    var flow = protractor.promise.controlFlow();
    flow.execute(moveRecords);

    expect(movesDone).toBe(true);
    expect(messages.count()).toBe(3);
    expect($('.message:nth-of-type(1) .priority').getText()).toEqual('0');
    expect($('.message:nth-of-type(2) .priority').getText()).toEqual('1');
    expect($('.message:nth-of-type(3) .priority').getText()).toEqual('4');

    // Make sure the content of each message is correct
    expect($('.message:nth-of-type(1) .content').getText()).toEqual('Pretty fantastic!');
    expect($('.message:nth-of-type(2) .content').getText()).toEqual('Oh, hi. How are you?');
    expect($('.message:nth-of-type(3) .content').getText()).toEqual('Hey there!');

    function moveRecords() {
      return setPriority(null, 4)
        .then(setPriority.bind(null, 2, 0));
    }

    function waitForMoveEvents() {
      var def = protractor.promise.defer();
      var count = 0;
      firebaseRef.on('child_moved', updateCount, def.reject);

      function updateCount() {
        if( ++count === 2 ) {
          setTimeout(function() {
            def.fulfill(true);
          }, 10);
          firebaseRef.off('child_moved', updateCount);
        }
      }
      return def.promise;
    }

    function setPriority(start, pri) {
      var def = protractor.promise.defer();
      firebaseRef.startAt(start).limit(1).once('child_added', function(snap) {
        var data = snap.val();
        //todo https://github.com/firebase/angularFire/issues/333
        //todo makeItChange just forces Angular to update the dom since it won't change
        //todo when a $ variable updates
        data.makeItChange = true;
        snap.ref().setWithPriority(data, pri, function(err) {
          if( err ) { def.reject(err); }
          else { def.fulfill(snap.key()); }
        })
      }, def.reject);
      return def.promise;
    }
  });
});