// json-graph.js


var aspire = aspire || {};
aspire.Model = (function (args) {

  // Static methods:
  var isArray = (Array && Array.isArray) ? Array.isArray : function (object) {
    return object && object.concat && object.unshift;
  };

  // TODO: fix this frightening object prototyping
  Object.prototype.map = function (transformation) {
    var results = {}
    for (var key in Object.keys(this)) {
      // [MDN - Object.keys()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys) states:
      // ... a for-in loop enumerates properties in the prototype chain as well
      if (this.hasOwnProperty(key)) {
        results[key] = transformation(this[key]);
      }
    }
    return results;
  }
  Object.prototype.to_a = function () {
    var results = [];
    for (var key in Object.keys(this)) {
      if (this.hasOwnProperty(key)) {
        results[key] = this[key];
      }
    }
    return results;
  };


  function Model(args) {

    // Constructor:
    var cache = (args === undefined) ? {} : args.cache || {};
    var source = null;


    // Private methods:
    this.transformQuery = function (query, alreadyNested) {

      var tokenStart = 0,
          tokenEnd = -1,
          depth = 0,
          results = [];

      // Default argument.
      alreadyNested = alreadyNested || false;

      // Default cases, when undefined, empty, or has no special tokens ('.','[')
      if (query === undefined)
        return [];

      if (typeof(query) === 'string')
        if (query.length === 0)
          return [];
        else if (query.search(/[.[]/) === -1)
          return alreadyNested ? query : [query];

      // Prepare query for mapping.
      for (var idx=0; idx < query.length; idx++) {

        // Split on top-level members
        if (query[idx] === '.' && depth === 0) {
          if (tokenStart !== idx)
            tokenEnd = idx;
            results.push(query.substring(tokenStart, tokenEnd));
          tokenStart=idx+1;
        }

        // Split on indicies or glob (*)
        else if (query[idx] === '[') {
          if (depth === 0) {
            if (tokenStart !== idx) {
              tokenEnd = idx;
              results.push(query.substring(tokenStart, tokenEnd));
            }

            // Defer handling the wildcard for all keys
            if (query.substring(idx,idx+3) === '[*]') {
              results.push(transformArrayGlob(results));
              tokenStart = idx + 3;
              depth--;
              idx += 2;
            }
            else {
              tokenStart = idx+1;
            }
          }
          depth++;
        }

        // Delegate nested array handling.
        else if (query[idx] === ']') {
          depth--;
          if (depth === 0) {
            tokenEnd = idx;
            results.push(transformQueryArray(query.substring(tokenStart, tokenEnd)));
            tokenStart = idx+1;
          }
        }
      }

      // Add last token if needed.
      if (idx !== tokenEnd && tokenStart !== idx) {
        results.push(query.substring(tokenStart, idx));
      }
      return results;
    };
    var transformQuery = this.transformQuery;

    var transformQueryArray = function (arrayItems) {

      // Is it a range, e.g.: 0..3?
      var range = arrayItems.match(/(\d+)[.][.](\d+)/);
      if (range !== null) {
        var results = [];
        range = range.slice(1).
                  map(function(i) { return parseInt(i,10); }).sort();
        for (var n = range[0]; n <= range[1]; n++)
          results.push(n.toString());
        return results;
      }

      // Otherwise we have a regular token or comma-separated items to parse.
      return arrayItems.split(',').
               map(function (item) { return transformQuery(item, true); });
    }

    var transformArrayGlob = function (query) {
      var results = [];
      var arrayObject = get(query);
      for (var key in Object.keys(arrayObject)) {
        if (arrayObject.hasOwnProperty(key)) {
          results.push(key);
        }
      }
      return results;
    }


    // Public Methods:
    this.get = function (path) {

      var keys,
          response;

      if (typeof(path) === undefined)
        return;

      // Transform strings.
      if (typeof(path) === 'string') { keys = path.split(".") }
      else if (isArray(path)) { keys = path; }
      else { throw new TypeError('Unexpected path.'); }

      if (keys.length === 1) {
        return cache[keys[0]];
      }
      else {
        return keys.reduce(function(tree, key) {
          var subtree = tree[key];
          if (subtree && subtree.$type && subtree.$type === 'ref')
            return this.get(subtree.value);
          else
            return subtree;
          }, cache);
      }
    }
    var get = this.get;

    this.set = function () {};

    // Alias methods:
    this.getValue = this.get;
    this.setValue = this.set;

  };
  Model.ref = function (value) {
    return { $type: 'ref', value: value };
  };
  return Model;
})();


/*

//  t=13m40s ----------------------------------------------------------------
// JSON
var member = {
  name: 'Steve McGuire',
  occupation: 'Developer',
  location: {
    country: 'US',
    city: 'Pacifica',
    address: '344 Seaside'
  }
};

// FALCOR
var member = new falcor.Model({
  source: new HTTPSource('/member.json'})
})
member.getValue(['location', 'address']).
  toPromise().
  then(print);

//  t=29m--------------------------------------------------------------------
// JSON
var model = {
  genreLists: [
    {
      name: "Suggestions for you",
      titlesList: [
        {
          id: 956,
          name: 'Friends',
          rating: 3
        }
      ]
    },
    {
      name: 'New Releases',
      titleList: [
        {
          id: 956,
          name: 'Friends',
          rating: 3
        }
      ]
    }
  ]
}
model['genreLists'][0]['titlesList'][0]['name']

// JSON Graph (Applicative 2015)
//  * Pointer := { $type: 'ref', 'titleById', 956 }
//  * Array is a map with ordinal keys; length => actual length.
var model = {
  genreLists: {
    "0": {
      name: "Suggestions for you",
      titlesList: {
        "0": ["titlesById", 956].
        "1": ["titlesById", 192]
        length: 75
      }
    },
    "1": {
      name: 'New Releases',
      titleList: {
        "0": ["titlesById", 956]
        length: 75
      }
    },
    length: 50
  },
  titlesById: {
    '956': {
      name: 'Friends',
      rating: 3
    }
  }
}

model.get / getValue
  -> get to a pointer, and recurse onto model.get(key)
  -> get *, or any key. WHAAAAAT?
model.set / setValue


//  t=44m
virtual model path evaluation and caching on the server side.


// Netflix JavaScript Talks - Falcor
//  t=26

{
  $type: 'ref',
  value: 'titlesById[956'
}

or

var $ref = falcor.Model.ref;
which creates the object. $ref('titlesById[956]')

*/
