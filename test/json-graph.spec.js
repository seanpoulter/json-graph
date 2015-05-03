// json-graph.spec.js


describe("_aspire_ to implement JSON Graph from _falcor_", function() {

  describe('using updates to Array.prototype', function() {

    it('.concatAll', function () {
      expect([[1,2,3], [4,5,6], [7,8,9]].concatAll()).toEqual([1,2,3,4,5,6,7,8,9]);
      expect(function () { [1,2,3].concatAll(); }).
        toThrowError(TypeError);
    });

    it('.flatMap', function () {
      expect(
        [[1,2,3], [4,5,6], [7,8,9]].
          flatMap(function (array) {
            return [array[0]];
          })
      ).toEqual([1,4,7]);
    });

    it('.isEqual', function () {
      expect([1,2,3].isEqual('abc')).toBe(false);
      expect([1,2,3].isEqual([])).toEqual(false);
      expect([1,2,3].isEqual([3,2,1])).toEqual(false);
      expect([1,2,3].isEqual([1,2,3])).toEqual(true);
    });
  });


  describe('with the same API as used in the demos, where it', function () {

    var model;
    beforeEach(function () {
        model = new aspire.Model();
    });

    it('has the namespace "aspire".', function() {
      expect(aspire).toBeDefined();
    });

    it('defines the class aspire.Model', function() {
      expect(aspire.Model).toBeDefined();
      expect(typeof(aspire.Model)).toBe('function');
    });

    /*
      cache is private.

    it('implements the model cache', function() {
      var model = new aspire.Model();
      expect(model.cache).toBeDefined();
      expect(typeof(model.cache)).toBe('object');
    });
    */

    it('defines the get/getValue methods', function() {
      expect(model.get).toBeDefined();
      expect(model.getValue).toBeDefined();
    });

    it('defines the set/setValue methods', function() {
      expect(model.set).toBeDefined();
      expect(model.setValue).toBeDefined();
    });

    it('defines the model.ref helper', function () {
      expect(aspire.Model.ref).toBeDefined();
    });
  });


  describe('which implements model.ref', function () {
    it('and builds reference objects', function () {
      var $ref = aspire.Model.ref;
      expect($ref('dataStructureById[7]')).toEqual(
        {
          $type: 'ref',
          value: 'dataStructureById[7]'
        }
      );
    });
  });


  describe('which implements a constructor', function () {
    it('that accepts a default cache value', function () {
      var model = new aspire.Model({
        cache: {
          data: 'toBeDefined'
        }
      });

      // OK, so a dependent test isn't be best but
      // the alternative is exposing
      expect(model.get('data')).toEqual('toBeDefined');
    });
  });

  describe('which implements get/getValue', function () {

    var model;
    var $ref = aspire.Model.ref;
    beforeEach(function() {
      model = new aspire.Model({
        cache: {
          key: 'value',
          complex: {
            key: 'another value',
            nested: {
              key: 'value',
              data: $ref('dataStructureById[8]')
            }
          },
          array: {
            "0": 'zero',
            "1": 'one',
            "2": 'two'
          },
          complex_array: {
            "0": {
              id: 123,
              name: 'apple',
              color: 'green'
            },
            "1": {
              id: 125,
              name: 'dragonfruit',
              color: 'red'
            },
            "2": {
              id: 124,
              name: 'orange',
              color: 'orange'
            }
          },
          dataStructureById: {
            7: { name: 'array' },
            8: { name: 'hash' },
            9: { name: 'linkedlist' },
            10: { name: 'doublylinkedlist'}
          }
        }
      });
    });

    describe('by parsing query strings', function () {
      it('and handles empty cases', function() {
        expect(model.transformQuery()).toEqual([]);
        expect(model.transformQuery('')).toEqual([]);
      });

      it('and handles regular properties', function () {
        expect(model.transformQuery('key')).toEqual(['key']);
      });

      it('and handles nested properties', function () {
        expect(model.transformQuery('nested.key')).toEqual(['nested', 'key']);
        expect(model.transformQuery('deep.nested.key')).toEqual(['deep','nested','key']);
      });

      it('and handles lists of properies', function () {
        expect(model.transformQuery('key1', 'key2')).toEqual(['key1'], ['key2']);
        expect(model.transformQuery('nested.key1', 'key2')).toEqual(['nested','key1'], ['key2']);
      });

      it('and handles array indicies', function () {
        expect(model.transformQuery('key[0]')).toEqual(['key', 0]);
      });

      it('and handles ranges for array indicies', function () {
        expect(model.transformQuery('key[0..5]')).toEqual(['key', [0,1,2,3,4,5]]);
      });

      it('and handles wildcard for array indicies', function () {
        model = new aspire.Model({
          cache: {
            data: {
              '0': { en: 'zero', fr: 'zero' },
              '1': { en: 'one', fr: 'un' },
              '2': { en: 'two', fr: 'deux' },
              '3': { en: 'three', fr: 'trois' }
            }
          }
        });
        expect(model.transformQuery('data[*]')).toEqual(['data', [0,1,2,3]]);
      });
    });

    xdescribe('and returing the expected values', function () {
      it('using .get() or .getValue()', function () {
        expect(model.get).toEqual(model.getValue);
      });

      it('when looking up a simple key', function() {
        expect(model.get('key')).toBe('value');
      });

      it('when looking up nested keys', function() {
        expect(model.get('complex.nested.key')).toBe('value');
      });

      it('when looking up keys with array indicies', function() {
        expect(model.get('dataStructureById[8]')).toEqual({ name: 'hash' });
      });

      it('when evaluating a plain reference', function() {
        expect(model.get('complex.nested.data')).toEqual({ name: 'hash' });
      });

      it('when evaluating a reference, and getting one of it\'s properties' , function() {
        expect(model.get('complex.nested.data.name')).toEqual('hash');
      });

      it('looks up arrays (as map)', function() {
        expect(model.get('array')).toEqual({0:'zero',1:'one',2:'two'});
      })

      it('uses a range operator, array[n..m]', function () {
        expect(model.get('complex_array[0..1].color')).toEqual({
          'json': {
            'complex_array': {
              '0': {
                name: 'apple'
              },
              '1': {
                name: 'dragonfruit'
              }
            }
          }
        });
      });

      xit('looks up multiple keys as arguments to get(...)', function () {
        expect(model.get('complex_array[0..1].name', 'complex_array[0..1].color')).toEqual({
          'json': {
            'complex_array': {
              '0': {
                name: 'apple',
                color: 'green'
              },
              '1': {
                name: 'dragonfruit',
                color: 'red'
              }
            }
          }
        });
      });

      xit('looks up multiple keys as arguments to get(...)', function () {
        expect(model.get('complex_array[0..1].["name","color"]')).toEqual({
          'json': {
            'complex_array': {
              '0': {
                name: 'apple',
                color: 'green'
              },
              '1': {
                name: 'dragonfruit',
                color: 'red'
              }
            }
          }
        });
      });
    });
  });
});

/*
  describe('it works like a normal object', function () {
    var g;
    beforeEach(function () {
      g = new JSONGraph();
    })

    it('can be empty', function() {
      expect(g).toEqual({});
    });

    it('can have a property', function () {
      g.member = 'data';
      expect(g.member).toEqual('data');
      expect(g['member']).toEqual('data');
    });
  });
*/
