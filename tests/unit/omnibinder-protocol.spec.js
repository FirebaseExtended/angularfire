describe('OmniBinder Protocol', function () {
  var firebinder;

  beforeEach(module('omniFire'));

  describe('objectChange', function () {
    var objectChange;

    beforeEach(inject(function (_objectChange_) {
      objectChange = _objectChange_;
    }));

    it('should generate a change object', function () {
      expect(objectChange('foo', 'update', 'bar', 'baz')).toEqual({
        name: 'foo',
        type: 'update',
        value: 'bar',
        oldValue: 'baz'
      });
    });
  });


  describe('arrayChange', function () {
    var arrayChange;

    beforeEach(inject(function (_arrayChange_) {
      arrayChange = _arrayChange_;
    }));

    it('should generate a change object', function () {
      expect(arrayChange(1, ['foo'], 1, ['baz'])).toEqual({
        index: 1,
        removed: ['foo'],
        addedCount: 1,
        added: ['baz']
      });
    });
  });


  describe('firebinder', function () {
    beforeEach(inject(function (_firebinder_) {
      firebinder = _firebinder_;
    }));


    it('should have a property called bar', function () {
      expect(typeof firebinder.subscribe).toBe('function');
    });

    describe('subscribe', function () {
       it('should create a new Firebase instance for the given location', function () {
          var binder = {query: {url: 'foo/bar/'}};
          firebinder.subscribe(binder);
          // can't use spyOn(Firbase) here; it breaks the prototype of MockFirebase (makes all methods undefined)
          expect(binder.fbRef.toString()).toEqual('foo/bar/');
       });

      it('should call limit if provided in query', function () {
        var binder = {query: {limit: 10, url: 'foo/bar'}};
        firebinder.subscribe(binder);
        expect(binder.fbRef.limit).toHaveBeenCalledWith(10);
      });


      it('should call startAt if provided in query', function () {
        var binder = {query: {limit: 20, startAt: 50, url: 'foo/bar'}};
        firebinder.subscribe(binder);
        expect(binder.fbRef.limit).toHaveBeenCalledWith(20);
        expect(binder.fbRef.startAt).toHaveBeenCalledWith(50);
      });

      describe('child_added', function () {
        var binder, snapshot,
            value = {foo: 'bar'};
        beforeEach(function (){
          binder = {
            query: {url: 'foo/bar'},
            onProtocolChange: angular.noop
          };

          snapshot = {
            val: 'foo',
            name: function () {
              return 'bar';
            },
            val: function () {
              return value;
            }
          }
        });


        it('should call on child_added on the ref during construction',
          function () {
            firebinder.subscribe(binder);
            expect(binder.fbRef.on.callCount).toBe(1);
          });


        it('should call onChildAdded on the event of the child being added',
          function () {
            var spy = spyOn(firebinder, 'onChildAdded');

            firebinder.subscribe(binder);
            binder.fbRef.flush();

            expect(spy).toHaveBeenCalled();
          });

        it('should insert the child\'s name at the beginning of the binder index if no prev is provided',
          function () {
            firebinder.subscribe(binder);
            binder.index.push('baz', 'foo');
            firebinder.onChildAdded.call(firebinder, binder, snapshot);

            expect(binder.index.indexOf('bar')).toBe(0);
          });

        it('should insert the child\'s name after the prev in the binder index',
          function () {
            firebinder.subscribe(binder);
            binder.index.push('baz', 'foo');
            firebinder.onChildAdded.call(firebinder, binder, snapshot, 'baz');

            expect(binder.index.indexOf('bar')).toBe(1);
          });

        it('should call binder.onProtocolChange', function () {
          var spy = spyOn(binder, 'onProtocolChange');
          firebinder.subscribe(binder);

          firebinder.onChildAdded(binder, snapshot);

          expect(spy).toHaveBeenCalledWith([{
            addedCount: 1,
            added: [value],
            index: 0,
            removed: []
          }]);
        });


        it('should not call binder.onProtocolChange if isLocal is true', function () {
          var spy = spyOn(binder, 'onProtocolChange');
          firebinder.subscribe(binder);
          binder.isLocal = true;
          firebinder.onChildAdded(binder, snapshot);

          expect(spy).not.toHaveBeenCalled();
          expect(binder.isLocal).toBe(false);
        });
      });
    });
  });
});
