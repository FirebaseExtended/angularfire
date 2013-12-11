var protractor = require('protractor'),
    tractor = protractor.getInstance(),
    cleared;

describe('OmniBinder Todo', function () {
  describe('child_added', function () {
    beforeEach(function () {

      tractor.get('http://localhost:8080/tests/e2e/test_todo-omnibinder.html');

      if (!cleared) {
        //Clear all firebase data
        tractor.findElement(protractor.By.css('#clearRef')).
          click();
        cleared = true;
      }

      expect(tractor.getTitle()).toBe('AngularFire TODO Test');
    });

    it('should no-op', function () {
      //Forced reload
    });

    it('should have an empty list of todos', function () {
      //Wait for items to be populated
      tractor.sleep(1000);

      tractor.findElements(protractor.By.css('#messagesDiv > div')).then(function (listItems) {
        expect(listItems.length).toBe(0);
      });
    });
  });
});
