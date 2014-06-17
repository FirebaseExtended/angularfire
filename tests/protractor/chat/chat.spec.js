var protractor = require('protractor');
var Firebase = require('firebase');

var ptor = protractor.getInstance();
var cleared = false;

describe('Chat App', function () {
  beforeEach(function (done) {
    // Navigate to the chat app
    ptor.get('chat/chat.html');

    // Verify the title
    expect(ptor.getTitle()).toBe('AngularFire Chat e2e Test');

    // Clear the Firebase before the first test and sleep until it's finished
    if (!cleared) {
      var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/');
      firebaseRef.remove(function() {
        cleared = true;
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

  it('starts with an empty list of messages', function () {
    var messages = element.all(by.repeater('message in messages'));
    expect(messages.count()).toBe(0);
  });

  it('adds new messages', function () {
    // Add three new messages by typing into the input and pressing enter
    var newMessageInput = element(by.model('message'));
    newMessageInput.sendKeys('Hey there!\n');
    newMessageInput.sendKeys('Oh, hi. How are you?\n');
    newMessageInput.sendKeys('Pretty fantastic!\n');

    var messages = element.all(by.repeater('message in messages'));
    expect(messages.count()).toBe(2);

    var messageCount = element(by.id('messageCount'));
    messageCount.getText().then(function(messageCount) {
      expect(parseInt(messageCount)).toBe(3);
    });
  });

  it('updates upon new remote messages', function(done) {
    // Simulate a message being added remotely
    var messagesFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/chat');
    messagesFirebaseRef.push({
      from: 'Guest 2000',
      content: 'Remote message detected'
    }, function() {
      var messageCountFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/numChatMessages');
      messageCountFirebaseRef.transaction(function(currentCount) {
        if (!currentCount) {
          return 1;
        } else {
          return currentCount + 1;
        }
      }, function() {
        var messages = element.all(by.repeater('message in messages'));
        expect(messages.count()).toBe(2);

        var messageCount = element(by.id('messageCount'));
        messageCount.getText().then(function(messageCount) {
          expect(parseInt(messageCount)).toBe(4);
          done();
        });
      });
    });
  });

  it('updates upon removed remote messages', function(done) {
    // Simulate a message being deleted remotely
    var messagesFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/chat');
    messagesFirebaseRef.limit(1).on("child_added", function(childSnapshot) {
      messagesFirebaseRef.off();
      childSnapshot.ref().remove(function() {
        var messageCountFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/numChatMessages');
        messageCountFirebaseRef.transaction(function(currentCount) {
          if (!currentCount) {
            return 1;
          } else {
            return currentCount - 1;
          }
        }, function() {
          var messages = element.all(by.repeater('message in messages'));
          expect(messages.count()).toBe(2);

          var messageCount = element(by.id('messageCount'));
          messageCount.getText().then(function(messageCount) {
            expect(parseInt(messageCount)).toBe(3);
            done();
          });
        });
      });
    });
  });
});