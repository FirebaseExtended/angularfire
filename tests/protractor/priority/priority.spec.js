var protractor = require('protractor');
var Firebase = require('firebase');

describe('Priority App', function () {
  // Protractor instance
  var ptor = protractor.getInstance();

  // Reference to the Firebase which stores the data for this demo
  var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/priority');

  // Boolean used to clear the Firebase on the first test only
  var firebaseCleared = false;

  // Reference to the messages repeater
  var messages = element.all(by.repeater('message in messages'));

  beforeEach(function (done) {
    // Navigate to the priority app
    browser.get('priority/priority.html');

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

  it('has the correct title', function() {
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

  it('updates priorities dynamically', function(done) {
    console.log("a");
    // Update the priority of the first message
    firebaseRef.startAt().limit(1).once("child_added", function(dataSnapshot1) {
      console.log("b");
      dataSnapshot1.ref().setPriority(4, function() {
        console.log("c");
        // Update the priority of the third message
        messagesFirebaseRef.startAt(2).limit(1).once("child_added", function(dataSnapshot2) {
          console.log("d");
          dataSnapshot2.ref().setPriority(0, function() {
            console.log("e");
            // Make sure the page has three messages
            expect(messages.count()).toBe(3);

            // Make sure the priority of each message is correct
            expect($('.message:nth-of-type(1) .priority').getText()).toEqual('0');
            expect($('.message:nth-of-type(2) .priority').getText()).toEqual('1');
            expect($('.message:nth-of-type(3) .priority').getText()).toEqual('4');

            // Make sure the content of each message is correct
            expect($('.message:nth-of-type(1) .content').getText()).toEqual('Pretty fantastic!');
            expect($('.message:nth-of-type(2) .content').getText()).toEqual('Oh, hi. How are you?');
            expect($('.message:nth-of-type(3) .content').getText()).toEqual('Hey there!');

            done();
          });
        });
      });
    });
  });
});