var protractor = require('protractor');
var Firebase = require('firebase');

describe('Priority App', function () {
  // Reference to the message repeater
  var messages = element.all(by.repeater('message in messages'));

  // Reference to the Firebase which stores the data for this demo
  var firebaseRef = new Firebase('https://angularfire.firebaseio-demo.com/priority');

  // Boolean used to load the page on the first test only
  var isPageLoaded = false;

  var flow = protractor.promise.controlFlow();

  function waitOne() {
    return protractor.promise.delayed(500);
  }

  function sleep() {
    flow.execute(waitOne);
  }

  function clearFirebaseRef() {
    var deferred = protractor.promise.defer();

    firebaseRef.remove(function(err) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.fulfill();
      }
    });

    return deferred.promise;
  }

  beforeEach(function (done) {
    if (!isPageLoaded) {
      isPageLoaded = true;

      // Navigate to the priority app
      browser.get('priority/priority.html').then(function() {
        // Get the random push ID where the data is being stored
        return $('#pushId').getText();
      }).then(function(pushId) {
        // Update the Firebase ref to point to the random push ID
        firebaseRef = firebaseRef.child(pushId);

        // Clear the Firebase ref
        return clearFirebaseRef();
      }).then(done);
    } else {
      done();
    }
  });


  it('loads', function () {
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

    sleep();

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
    flow.execute(moveRecords);
    flow.execute(waitOne);

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

    function setPriority(start, pri) {
      var def = protractor.promise.defer();
      firebaseRef.startAt(start).limitToFirst(1).once('child_added', function(snap) {
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
