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

  beforeEach(function (done) {
    // Navigate to the chat app
    browser.get('chat/chat.html');

    // Clear the Firebase before the first test and sleep until it's finished
    if (!firebaseCleared) {
      firebaseRef.remove(function() {
        firebaseCleared = true;
        done();
      });
    }
    else {
      ptor.sleep(500);
      done();
    }
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

    // We should only have two messages in the repeater since we did a limit query
    expect(messages.count()).toBe(2);

    // Messages count should include all messages, not just the ones displayed
    expect(messagesCount.getText()).toEqual('3');
  });

  it('updates upon new remote messages', function (done) {
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
      }, function () {
        // We should only have two messages in the repeater since we did a limit query
        expect(messages.count()).toBe(2);

        // Messages count should include all messages, not just the ones displayed
        expect(messagesCount.getText()).toEqual('4');

        // We need to sleep long enough for the promises above to resolve
        ptor.sleep(500).then(function() {
          done();
        });
      });
    });
  });

  it('updates upon removed remote messages', function (done) {
    // Simulate a message being deleted remotely
    var onCallback = firebaseRef.child("messages").limit(1).on("child_added", function(childSnapshot) {
      firebaseRef.child("messages").off("child_added", onCallback);
      childSnapshot.ref().remove(function() {
        firebaseRef.child("numMessages").transaction(function(currentCount) {
          if (!currentCount) {
            return 1;
          } else {
            return currentCount - 1;
          }
        }, function() {
          // We should only have two messages in the repeater since we did a limit query
          expect(messages.count()).toBe(2);

          // Messages count should include all messages, not just the ones displayed
          expect(messagesCount.getText()).toEqual('3');

          // We need to sleep long enough for the promises above to resolve
          ptor.sleep(500).then(function() {
            done();
          });
        });
      });
    });
  });

  it('stops updating once the AngularFire bindings are destroyed', function () {
    // Destroy the AngularFire bindings
    $('#destroyButton').click();

    expect(messages.count()).toBe(0);
    expect(messagesCount.getText()).toEqual('0');
  });
});