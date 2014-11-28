var protractor = require('protractor');
var Firebase = require('firebase');

describe('TicTacToe App', function () {
  // Reference to the Firebase which stores the data for this demo
  var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/tictactoe');

  // Boolean used to clear the Firebase on the first test only
  var firebaseCleared = false;

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

  function clearFirebase() {
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
  }

  beforeEach(function () {
    // Clear the Firebase before the first test and sleep until it's finished
    if (!firebaseCleared) {
      flow.execute(clearFirebase);
    }

    // Navigate to the tictactoe app
    browser.get('tictactoe/tictactoe.html');

    // wait for page to load
    sleep();
  });

  it('loads', function () {
  });

  it('has the correct title', function () {
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

  it('persists state across refresh', function() {
    // Make sure the board has 9 cells
    expect(cells.count()).toBe(9);

    // Make sure the content of each clicked cell is correct
    expect(cells.get(0).getText()).toBe('X');
    expect(cells.get(2).getText()).toBe('O');
    expect(cells.get(6).getText()).toBe('X');
  });

  it('stops updating Firebase once the AngularFire bindings are destroyed', function () {
    // Make sure the board has 9 cells
    expect(cells.count()).toBe(9);

    // Destroy the AngularFire bindings
    $('#destroyButton').click();
    $('#resetRef').click();

    // Click the middle cell
    cells.get(4).click();
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