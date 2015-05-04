// json-graph.spec.js
// Sean Poulter, 2015

'use strict';

describe('Array.prototype', function() {

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

describe("_aspire_ to build JSON Graph as demonstrated in _falcor_", function() {

  describe('API', function () {

    var model;
    beforeEach(function () {
        model = new aspire.Model();
    });

    it('aspire', function() {
      expect(aspire).toBeDefined();
    });
    it('aspire.Model', function() {
      expect(aspire.Model).toBeDefined();
      expect(typeof(aspire.Model)).toBe('function');
    });
    it('aspire.Model#get', function() {
      expect(model.get).toBeDefined();
    });
    it('aspire.Model#getValue', function() {
      expect(model.getValue).toBeDefined();
      expect(model.get).toEqual(model.getValue);
    });
    it('aspire.Model#set', function() {
      expect(model.set).toBeDefined();
    });
    it('aspire.Model#setValue', function() {
      expect(model.setValue).toBeDefined();
      expect(model.set).toEqual(model.setValue);
    });
    it('aspire.Model::ref', function() {
      expect(aspire.Model.ref).toBeDefined();
    });
  });

  describe('apsire.Model::ref', function () {
    it('returns reference object', function () {
      var $ref = aspire.Model.ref;
      expect($ref('dataStructureById[7]')).toEqual(
        {
          $type: 'ref',
          value: 'dataStructureById[7]'
        }
      );
    });
  });

  describe('aspire.Model()', function () {
    it('accepts { cache: {...} }', function () {
      var model = new aspire.Model({
        cache: {
          data: 'toBeDefined'
        }
      });
      expect(model.get('data')).toEqual('toBeDefined');
    });
  });

  describe('aspire.Model#get / #getValue', function () {

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

    describe('parses input', function () {

      it('empty cases', function() {
        expect(model.transformQuery()).toEqual([]);
        expect(model.transformQuery('')).toEqual([]);
      });

      it('property', function () {
        expect(model.transformQuery('key')).toEqual([['key']]);
      });

      it('properties nested with \'.\'', function () {
        expect(model.transformQuery('nested.key')).toEqual([['nested'], ['key']]);
        expect(model.transformQuery('deep.nested.key')).toEqual([['deep'],['nested'],['key']]);
      });

      it('properties nested with \'[...]\'', function () {
        expect(model.transformQuery("nested['key']")).toEqual([['nested'], ['key']]);
        expect(model.transformQuery("deep['nested']['key']")).toEqual([['deep'],['nested'],['key']]);
        expect(model.transformQuery("key['0']")).toEqual([['key'], ['0']]);
      });

      it('array index', function () {
        expect(model.transformQuery('key[0]')).toEqual([['key'], [0]]);
      });

      it('array index ranges, \'[n..m]\'', function () {
        expect(model.transformQuery('key[0..5]')).toEqual([['key'], [0,1,2,3,4,5]]);
      });

      it('array index wildcards, \'[*]\'', function () {
        model = new aspire.Model({
          cache: {
            data: {
              0: { en: 'zero', fr: 'zero' },
              1: { en: 'one', fr: 'un' },
              2: { en: 'two', fr: 'deux' },
              3: { en: 'three', fr: 'trois' }
            }
          }
        });
        expect(model.transformQuery('data[*]')).
          toEqual([['data'], ['0','1','2','3']]); // Object.keys makes keys strings.
      });

      it('property lists, \'[prop1, prop2]\'', function () {
        expect(model.transformQuery("array['0','1','2']")).toEqual([['array'], ['0','1','2']]);
        expect(model.transformQuery("data['id','name']")).toEqual([['data'], ['id','name']]);
      });
    });

    describe('returns values for', function () {

      it('property', function() {
        expect(model.get('key')).toBe('value');
      });

      it('properties nested with \'.\'', function() {
        expect(model.get('complex.nested.key')).toBe('value');
      });

      it('properties nested with \'[...]\'', function() {
        expect(model.get("complex['nested']['key']")).toBe('value');
      });

      it('array index', function() {
        expect(model.get('dataStructureById[8]')).toEqual({ name: 'hash' });
      });

      it('looks up multiple keys as arguments to get(...)', function () {
        expect(model.get('complex_array[0,1].name')).toEqual({
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

      xit('array index ranges, \'[n..m]\'', function () {
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
      xit('array index wildcards, \'[*]\'', function () {
        var data = {
              0: {
                list: {
                  0: 'a',
                  1: 'b',
                  2: 'c'
                }
              },
              1: {
                list: {
                  0: '5',
                  1: '4',
                  2: '3',
                  3: '2',
                  4: '1',
                  5: '0'
                }
              },
              2: {
                list: {
                  0: []
                }
              }
            };
        model = new aspire.Model({
          cache: {
            data: data
          }
        });
        expect(model.transformQuery('data[*].list[*]')).
          toEqual(data);
      });

      it('reference', function() {
        expect(model.get('complex.nested.data')).toEqual({ name: 'hash' });
      });
      it('reference properties' , function() {
        expect(model.get('complex.nested.data.name')).toEqual('hash');
      });

      it('(associative) array', function() {
        expect(model.get('array')).toEqual({0:'zero',1:'one',2:'two'});
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

      xit('to handle lists of properies', function () {
        expect(model.transformQuery('key1', 'key2')).toEqual([['key1'], ['key2']]);
        expect(model.transformQuery('nested.key1', 'key2')).toEqual([['nested'],['key1']], [['key2']]);
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
