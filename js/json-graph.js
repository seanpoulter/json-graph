// json-graph.js


var aspire = aspire || {};
aspire.Model = (function (args) {

  // Static methods:
  var isArray = (Array && Array.isArray) ? Array.isArray : function (object) {
    return object && object.concat && object.unshift;
  };

  Array.prototype.concatAll = function() {
    var results = [];
    this.forEach(function(subArray) {
      results.push.apply(results, subArray);
    })
    return results;
  }
  Array.prototype.flatMap = function (projection) {
    return this.map(function(item) {
      return projection(item);
    }).
    concatAll();
  }
  Array.prototype.isEqual = function(array) {
    if (!isArray(array) || this.length !== array.length)
      return false;
    return this.every(function (currentValue, index) {
      return currentValue === array[index];
    });
  }

  function Model(args) {

    // Constructor:
    var cache = (args === undefined) ? {} : args.cache || {};
    var source = null;


    // Private methods:
    this.transformQuery = function (query) {

      var tokenStart = 0,
          tokenEnd = -1,
          depth = 0,
          results = [];

      // Default cases, when undefined, empty, or has no special tokens ('.','[')
      if (query === undefined)
        return [];

      // Query is an empty string or simple key
      if (typeof(query) === 'string')
        if (query.length === 0)
          return [];
        else if (query.search(/[.[]/) === -1)
          if (query.search(/^['"'].*['"']$/) === -1)
            return [[query]];
          else
            return [[query.substring(1,query.length-1)]]

      // Prepare query for mapping.
      for (var idx=0; idx < query.length; idx++) {

        // Split on top-level members
        if (query[idx] === '.' && depth === 0) {
          if (tokenStart !== idx) {
            tokenEnd = idx;
            results.push([query.substring(tokenStart, tokenEnd)]);
          }
          tokenStart=idx+1;
        }

        // Split on indicies or glob (*)
        else if (query[idx] === '[') {

          // Top-level indicies => capture token
          if (depth === 0) {

            // Store the previous token
            if (tokenStart !== idx) {
              tokenEnd = idx;
              results.push([query.substring(tokenStart, tokenEnd)]);
            }

            // Defer handling the wildcard for all keys
            if (query.substring(idx,idx+3) === '[*]') {
              results.push([Model.wildcard]);
              tokenStart = idx + 3;
              depth--;
              idx += 2;
            }
            // Or start the next token
            else {
              tokenStart = idx+1;
            }
          }
          depth++;
        }

        // Delegate nested array handling when at top-level
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
        results.push([query.substring(tokenStart, idx)]);
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
          results.push(n);
        return results;
      }

      // Otherwise we have a regular token or comma-separated items to parse.
      if (typeof(arrayItems) === 'string' && arrayItems.search(/^\d+$/) !== -1)
        return [parseInt(arrayItems, 10)];
      else
        return arrayItems.split(',').
          flatMap(function (item) {
            return transformQuery(item, true)[0];
          });
    };


    /*

    It will be curious to see how Falcor implements the wildcard, as either all
    properties or limited to associative arrays numeric indicies. Since this
    implementation fails for nested wildcards, evaluation is shifted to runtime.

    var transformArrayGlob = function (query) {
      var results = [];
      var arrayObject = getWithTransformedQuery([query]);
      for (var key in Object.keys(arrayObject)) {
        if (arrayObject.hasOwnProperty(key)) {
          results.push(key);
        }
      }
      return results;
    };
    */


    var isObjectReference = function (object) {
      return typeof(object) === 'object' && object.hasOwnProperty('$type');
    };



    // Public Methods:
    this.get = function () {

      var queryList = [];

      if (arguments.length === 0)
        return;
      for (var idx = 0; idx < arguments.length; idx++) {
        if (typeof(arguments[idx]) !== 'string')
          console.error('Unexpected argument', arguments[idx], 'in', arguments);
        queryList.push(transformQuery(arguments[idx]));
      }

      return getWithTransformedQuery(queryList);

    }
    var get = this.get;



    var getWithTransformedQuery = function (queryList)
    {
      var result = {},
          missingData = {},
          isSingletonValue = (queryList.length > 1) ? false : true,
          qkIdx,
          keys,
          refs,
          refIdx;

      queryList.forEach(function (query) {

        refs = [{
          cache: cache,
          result: result
        }];
        for (qkIdx = 0; qkIdx < query.length; qkIdx++) {

          keys = query[qkIdx];
          refs = refs.flatMap(function (ref) {

            if (Model.isWildcard(query[qkIdx]))
              keys = Object.getOwnPropertyNames(ref.cache);
            if (keys.length > 1)
              isSingletonValue = false;

            return keys.map(function (key) {
              if (ref.cache.hasOwnProperty(key)) {

                var nextCacheRef = ref.cache,
                    nextResultRef = ref.result;

                // Evaluate references
                if (isObjectReference(nextCacheRef[key]))
                  nextCacheRef = get(nextCacheRef[key].value)
                else
                  nextCacheRef = nextCacheRef[key]

                // Assign values or build the return object.
                if (qkIdx === query.length - 1)
                  nextResultRef[key] = nextCacheRef;
                else
                  nextResultRef[key] = nextResultRef[key] || {};
                nextResultRef = nextResultRef[key]

                return {
                  cache: nextCacheRef,
                  result: nextResultRef
                };
              }
              else {
                // TODO: capture query with this key to load
                return null;
              }
            }).
            filter(function (ref) {
              return ref !== null;
            });
          });
        };
      });

      if (isSingletonValue)
        return refs[0].cache;
      else
        return {
          json: result
        };
    };




    this.set = function () {};

    // Alias methods:
    this.getValue = this.get;
    this.setValue = this.set;

  };
  Model.ref = function (value) {
    return { $type: 'ref', value: value };
  };
  Model.wildcard = function ArrayGlob () {
    // To implement the property wildcard and workaround the fact that '*' is a
    // valid property, this function is used as a unique identifier.
  };
  Model.isWildcard = function (array) {
    return array.isEqual([Model.wildcard]);
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
