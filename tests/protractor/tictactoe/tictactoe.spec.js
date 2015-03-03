var protractor = require('protractor');
var Firebase = require('firebase');

describe('TicTacToe App', function () {
  // Reference to the Firebase which stores the data for this demo
  var firebaseRef = new Firebase('https://angularfire.firebaseio-demo.com/tictactoe');

  // Boolean used to load the page on the first test only
  var isPageLoaded = false;

  // Reference to the messages repeater
  //var cells = $$('.cell');
  var cells = element.all(by.css('.cell'));

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

      // Navigate to the tictactoe app
      browser.get('tictactoe/tictactoe.html').then(function() {
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
    expect(browser.getTitle()).toEqual('AngularFire TicTacToe e2e Test');
  });

  it('starts with an empty board', function () {
    // Reset the board
    $('#resetRef').click();

    // Wait for the board to reset
    sleep();

    // Make sure the board has 9 cells
    var cells = element.all(by.css('.cell'));
    expect(cells.count()).toBe(9);

    // Make sure the board is empty
    cells.each(function(element) {
      expect(element.getText()).toBe('');
    });
  });

  it('updates the board when cells are clicked', function () {
    // Make sure the board has 9 cells
    expect(cells.count()).toBe(9);

    // Make three moves by clicking the cells
    cells.get(0).click();
    cells.get(2).click();
    cells.get(6).click();

    sleep();

    // Make sure the content of each clicked cell is correct
    expect(cells.get(0).getText()).toBe('X');
    expect(cells.get(2).getText()).toBe('O');
    expect(cells.get(6).getText()).toBe('X');
  });

  it('persists state across refresh', function(done) {
    // Refresh the page, passing the push ID to use for data storage
    browser.get('tictactoe/tictactoe.html?pushId=' + firebaseRef.key()).then(function() {
      // Wait for AngularFire to sync the initial state
      sleep();
      sleep();

      // Make sure the board has 9 cells
      expect(cells.count()).toBe(9);

      // Make sure the content of each clicked cell is correct
      expect(cells.get(0).getText()).toBe('X');
      expect(cells.get(2).getText()).toBe('O');
      expect(cells.get(6).getText()).toBe('X');

      done();
    });
  });

  it('stops updating Firebase once the AngularFire bindings are destroyed', function () {
    // Make sure the board has 9 cells
    expect(cells.count()).toBe(9);

    // Destroy the AngularFire bindings
    $('#destroyButton').click();
    $('#resetRef').click();

    // Click the middle cell
    cells.get(4).click();

    sleep();

    expect(cells.get(4).getText()).toBe('X');

    sleep();

    // make sure values are not changed on the server
    flow.execute(function() {
      var def = protractor.promise.defer();
      firebaseRef.child('x1/y2').once('value', function (dataSnapshot) {
        expect(dataSnapshot.val()).toBe('');
        def.fulfill();
      });
      return def.promise;
    });
  });
});
