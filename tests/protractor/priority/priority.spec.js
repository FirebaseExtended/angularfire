var protractor = require('protractor');
var firebase = require('firebase');
require('../../initialize-node.js');

// Various messages sent to demo
const MESSAGES_PREFAB = [
  {
    from: "Default Guest 1",
    content: 'Hey there!'
  },
  {
    from: "Default Guest 2",
    content: 'Oh Hi, how are you?'
  },
  {
    from: "Default Guest 1",
    content: "Pretty fantastic!"
  }
];

describe('Priority App', function () {
  // Reference to the message repeater
  var messages = element.all(by.repeater('message in messages'));

  // Reference to the Firebase which stores the data for this demo
  var firebaseRef;

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
        return browser.waitForAngular()
      }).then(function() {
        return element(by.id('url')).evaluate('url');
      }).then(function (url) {
        // Get the random push ID where the data is being stored
        return firebase.database().refFromURL(url);
      }).then(function(ref) {
        // Update the Firebase ref to point to the random push ID
        firebaseRef = ref;

        // Clear the Firebase ref
        return clearFirebaseRef();
      }).then(done)
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
    var usernameInput = element(by.model('username'));
    var newMessageInput = element(by.model('message'));

    MESSAGES_PREFAB.forEach(function (msg) {
      usernameInput.clear();
      usernameInput.sendKeys(msg.from);
      newMessageInput.sendKeys(msg.content + '\n');
    });

    sleep();

    // Make sure the page has three messages
    expect(messages.count()).toBe(3);

    // Make sure the priority of each message is correct
    expect($('.message:nth-of-type(1) .priority').getText()).toEqual('0');
    expect($('.message:nth-of-type(2) .priority').getText()).toEqual('1');
    expect($('.message:nth-of-type(3) .priority').getText()).toEqual('2');

    // Make sure the content of each message is correct
    expect($('.message:nth-of-type(1) .content').getText()).toEqual(MESSAGES_PREFAB[0].content);
    expect($('.message:nth-of-type(2) .content').getText()).toEqual(MESSAGES_PREFAB[1].content);
    expect($('.message:nth-of-type(3) .content').getText()).toEqual(MESSAGES_PREFAB[2].content);
  });

  it('responds to external priority updates', function () {
    flow.execute(moveRecords);
    flow.execute(waitOne);


    expect(messages.count()).toBe(3);
    expect($('.message:nth-of-type(1) .priority').getText()).toEqual('0');
    expect($('.message:nth-of-type(2) .priority').getText()).toEqual('1');
    expect($('.message:nth-of-type(3) .priority').getText()).toEqual('4');

    // Make sure the content of each message is correct
    expect($('.message:nth-of-type(1) .content').getText()).toEqual(MESSAGES_PREFAB[2].content);
    expect($('.message:nth-of-type(2) .content').getText()).toEqual(MESSAGES_PREFAB[1].content);
    expect($('.message:nth-of-type(3) .content').getText()).toEqual(MESSAGES_PREFAB[0].content);


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
        snap.ref.setWithPriority(data, pri, function(err) {
          if( err ) { def.reject(err); }
          else { def.fulfill(snap.key); }
        })
      }, def.reject);
      return def.promise;
    }
  });
});
