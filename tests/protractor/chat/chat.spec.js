var protractor = require('protractor');
var Firebase = require('firebase');

describe('Chat App', function () {
  // Protractor instance
  var ptor = protractor.getInstance();

  // Reference to the Firebase which stores the data for this demo
  var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/chat');

  // Boolean used to clear the Firebase on the first test only
  var firebaseCleared = false;

  // Reference to the messages repeater
  var messages = element.all(by.repeater('message in messages'));

  // Reference to messages count
  var messagesCount = element(by.id('messagesCount'));

  var flow = protractor.promise.controlFlow();

  function waitOne() {
    return protractor.promise.delayed(500);
  }

  function sleep() {
    flow.execute(waitOne);
  }

  beforeEach(function () {
    // Clear the Firebase before the first test and sleep until it's finished
    if (!firebaseCleared) {
      flow.execute(function() {
        var def = protractor.promise.defer();
        firebaseRef.remove(function(err) {
          if( err ) {
            def.reject(err);
          }
          else {
            firebaseCleared = true;
            def.fulfill();
          }
        });
        return def.promise;
      });
    }

    // Navigate to the chat app
    browser.get('chat/chat.html');

    // wait for page to load
    sleep();
  });

  it('loads', function () {
  });

  it('has the correct title', function () {
    expect(browser.getTitle()).toEqual('AngularFire Chat e2e Test');
  });

  it('starts with an empty list of messages', function () {
    expect(messages.count()).toBe(0);
    expect(messagesCount.getText()).toEqual('0');
  });

  it('adds new messages', function () {
    // Add three new messages by typing into the input and pressing enter
    var newMessageInput = element(by.model('message'));
    newMessageInput.sendKeys('Hey there!\n');
    newMessageInput.sendKeys('Oh, hi. How are you?\n');
    newMessageInput.sendKeys('Pretty fantastic!\n');

    sleep();

    // We should only have two messages in the repeater since we did a limit query
    expect(messages.count()).toBe(2);

    // Messages count should include all messages, not just the ones displayed
    expect(messagesCount.getText()).toEqual('3');
  });

  it('updates upon new remote messages', function () {
    flow.execute(function() {
      var def = protractor.promise.defer();
      // Simulate a message being added remotely
      firebaseRef.child("messages").push({
        from: 'Guest 2000',
        content: 'Remote message detected'
      }, function() {
        // Update the message count as well
        firebaseRef.child("numMessages").transaction(function(currentCount) {
          if (!currentCount) {
            return 1;
          } else {
            return currentCount + 1;
          }
        }, function (e, c, s) {
          if( e ) { def.reject(e); }
          else { def.fulfill(); }
        });
      });
      return def.promise;
    });

    // We should only have two messages in the repeater since we did a limit query
    expect(messages.count()).toBe(2);

    // Messages count should include all messages, not just the ones displayed
    expect(messagesCount.getText()).toEqual('4');
  });

  it('updates upon removed remote messages', function () {
    flow.execute(function() {
      var def = protractor.promise.defer();
      // Simulate a message being deleted remotely
      var onCallback = firebaseRef.child("messages").limitToLast(1).on("child_added", function(childSnapshot) {
        firebaseRef.child("messages").off("child_added", onCallback);
        childSnapshot.ref().remove(function() {
          firebaseRef.child("numMessages").transaction(function(currentCount) {
            if (!currentCount) {
              return 1;
            } else {
              return currentCount - 1;
            }
          }, function(err) {
            if( err ) { def.reject(err); }
            else { def.fulfill(); }
          });
        });
      });
      return def.promise;
    });

    // We should only have two messages in the repeater since we did a limit query
    expect(messages.count()).toBe(2);

    // Messages count should include all messages, not just the ones displayed
    expect(messagesCount.getText()).toEqual('3');
  });

  it('stops updating once the AngularFire bindings are destroyed', function () {
    // Destroy the AngularFire bindings
    $('#destroyButton').click();

    sleep();

    expect(messages.count()).toBe(0);
    expect(messagesCount.getText()).toEqual('0');
  });
});