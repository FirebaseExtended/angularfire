var protractor = require('protractor');
var Firebase = require('firebase');

var ptor = protractor.getInstance();
var cleared = false;

describe('Priority App', function () {
  beforeEach(function (done) {
    // Navigate to the priority app
    ptor.get('priority/priority.html');

    // Verify the title
    expect(ptor.getTitle()).toBe('AngularFire Priority e2e Test');

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
    var messages = element.all(by.repeater('message in messages | orderByPriority'));
    expect(messages.count()).toBe(0);
  });

  it('adds new messages with the correct priority', function () {
    // Add three new messages by typing into the input and pressing enter
    var newMessageInput = element(by.model('message'));
    newMessageInput.sendKeys('Hey there!\n');
    newMessageInput.sendKeys('Oh, hi. How are you?\n');
    newMessageInput.sendKeys('Pretty fantastic!\n');

    var messages = element.all(by.repeater('message in messages | orderByPriority'));
    expect(messages.count()).toBe(3);

    // Make sure the priority of each message is correct
    element(by.css('.message:nth-of-type(1) .priority')).getText().then(function(priority) {
      expect(parseInt(priority)).toBe(0);
    });
    element(by.css('.message:nth-of-type(2) .priority')).getText().then(function(priority) {
      expect(parseInt(priority)).toBe(1);
    });
    element(by.css('.message:nth-of-type(3) .priority')).getText().then(function(priority) {
      expect(parseInt(priority)).toBe(2);
    });
  });

  it('updates priorities dynamically', function(done) {
    var messagesFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/priority/');

    // Update the priority of the first message
    messagesFirebaseRef.startAt().limit(1).once("child_added", function(dataSnapshot) {
      dataSnapshot.ref().setPriority(4, function() {
        // Update the priority of the third message
        messagesFirebaseRef.startAt(2).limit(1).once("child_added", function(dataSnapshot) {
          dataSnapshot.ref().setPriority(0, function() {
            // Make sure the priority of each message is correct
            element(by.css('.message:nth-of-type(1) .priority')).getText().then(function(priority) {
              expect(parseInt(priority)).toBe(0);
              element(by.css('.message:nth-of-type(2) .priority')).getText().then(function(priority) {
                expect(parseInt(priority)).toBe(1);
                element(by.css('.message:nth-of-type(3) .priority')).getText().then(function(priority) {
                  expect(parseInt(priority)).toBe(4);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});