var protractor = require('protractor');
var Firebase = require('firebase');

describe('TicTacToe App', function () {
  // Protractor instance
  var ptor = protractor.getInstance();

  // Reference to the Firebase which stores the data for this demo
  var firebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/tictactoe');

  // Boolean used to clear the Firebase on the first test only
  var firebaseCleared = false;

  // Reference to the messages repeater
  var cells = $$('.cell');

  beforeEach(function (done) {
    // Navigate to the tictactoe app
    browser.get('tictactoe/tictactoe.html');

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
    expect(browser.getTitle()).toEqual('AngularFire TicTacToe e2e Test');
  });

  it('starts with an empty board', function () {
    // Reset the board
    $('#resetRef').click();

    // Wait for the board to reset
    ptor.sleep(1000);

    // Make sure the board has 9 cells
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

  it('stops updating Firebase once the AngularFire bindings are destroyed', function (done) {
    // Make sure the board has 9 cells
    expect(cells.count()).toBe(9);

    // Destroy the AngularFire bindings
    $('#destroyButton').click();

    // Click the middle cell
    cells.get(4).click();

    // Make sure the content of the clicked cell is correct
    expect(cells.get(4).getText()).toBe('X');

    // Refresh the browser
    browser.refresh();

    // Sleep to allow Firebase bindings to take effect
    ptor.sleep(500);

    // Make sure the content of the previously clicked cell is empty
    expect(cells.get(4).getText()).toBe('');

    // Make sure Firebase is not updated
    firebaseRef.child('x1/y1').once('value', function (dataSnapshot) {
      expect(dataSnapshot.val()).toBe('');

      done();
    });
  });
});