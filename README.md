# CacheUp
A general purpose caching library using multiple data storages

At the moment, `CacheUp` supports 2 data storages `memory` and `redis`. The API for all storages are the same, so storages can be switched without changing any code

## Redis
At the moment, `redis` does not have clustering support in the stable branch. `CacheUp` supports the use of multiple redis servers through consistent hashing algorithm. The mechanism is quite simple at first and does not support re-hashing keys when adding/removing servers (could be added in the future versions)

The simpliest configuration for `redis` when using `CacheUp`
```javascript
var cache = new Cacheup({
  servers: [
    {
      host: '127.0.0.1',
      port: 6379
    },
    {
      host: '127.0.0.1',
      port: 6378,
      password: 'i-am-invincible'
    }
  ],
  type: 'redis'
}));
```

Or when there is only one redis server to be used
```javascript
var cache = new Cacheup({
  host: '127.0.0.1',
  port: 6378,
  password: 'i-am-invincible',
  type: 'redis'
}));
```

## Memory
Memory caching is not encouraged for using in production environment. It is supposed to be used during development (or demonstration) only. Using it in production might cause the server to be exploded and you hold full responsible for the consequences

Initiate the `memory` storage
```javascript
var cache = new Cacheup({
  type: 'memory'
})
```

## Other configuration options
* `ttl`: the default time (in seconds) that the data should be cached. Default: `7200`
* `extendttl`: auto increase the expire time of a key when accessing it. Default `false`. This should be changed to true if you want your data to be cached forever (well not really, but as long as someone accesses it, the timer is reset)

Options can be passed in when calling a specific method to override the default one

## Install
```base
npm install cacheup
```

Load the library
```javascript
var CacheUp = require('cacheup');
```

## APIs
All APIs support passing arguments normally as well as using object. For example
```javascript
cache.set(key, value, options, callback);

// Is equivalent to
cache.set({
  key: key,
  value: value,
  options: options,
  callback: callback
});
```

All APIs support callback and promise style
```javascript
cache.set(key, value, function(error, data){
  
});
// Is equivalent to
cache.set(key, value).done(function(data){
  
}, function(error){
  
});
```

### CacheUp.set(key, value [, options, callback])
Cache a `value` in `key`  
**Options**
* `ttl`: set the time (in seconds) for the data to be cached  

**Examples**
```javascript
cache.set(key, value).done(function(data){
  // data is the same as value
}, handleError);

// or callback-style
cache.set(key, value, function(error, data){
  if (error) return handleError(error);

});
```

Setting custom `ttl`
```javascript
cache.set(key, value, {ttl: 3600}).done(function(data){
  // data is the same as value
}, handleError);
// when using callback-style, the callback will go after the options
cache.set(key, value, {ttl: 3600}, function(error, data){
  if (error) return handleError(error);

});
```

### CacheUp.get(key [, options, callback])
Get the data at `key`  
**Options**
* `extendttl`: whether to auto reset the timer of the cached data

**Examples**
```javascript
cache.get(key).done(function(data){
  
}, handleError);

// or callback-style
cache.get(key, function(error, data){
  if (error) return handleError(error);

});
```

Setting custom `extendttl`
```javascript
cache.get(key, {extendttl: true}).done(function(data){
  
}, handleError);
// when using callback-style, the callback will go after the options
cache.get(key, {extendttl: true}, function(error, data){
  if (error) return handleError(error);

});
```

### CacheUp.fetch(key, fetch [, options, callback])
This is the convinient method to get the data from somewhere when it is not available and return the cached data when it is already cached

`fetch` can be written in callback or promise style. If it is written in callback style, the option `callback` must be set to true

**Options**
* `ttl`: set the time (in seconds) for the data to be cached  
* `extendttl`: whether to auto reset the timer of the cached data  
* `callback`: set to `true` to indicate that `fetch` is written in callback style

**Examples**
```javascript
// fetch in callback style
var getRecordFromDb = function(done) {
  queryDb(function(error, data){
    // do something with the data, maybe?
    done(error, data);
  });
}

// fetch in promise style
var getRecordFromDbPromise = function() {
  var deferred = getDefered(); // use some promise libraries to obtain the deferred object

  queryDb(function(error, data){
    // maybe use some utilities come with the promise library to "promisify" queryDb
    if (error) return deferred.reject(error);
    deferred.resolve(data);
  });

  return deferred.promise;
}

// then use it in cache
cache.fetch(key, getRecordFromDb, {ttl: 10000}, function(error, data){
  // here, data can be either from queryDb or from the cache depends on the availability of it
});
```
### CacheUp.del(key, fetch [, options, callback])
Delete the data at key and return the key

**Options**
There is no option for this, the signature is just for consistency

### CacheUp.check(key [, options, callback])
Get the remaining time of the key (in seconds)

**Options**
There is no option for this, the signature is just for consistency

### CacheUp.touch(key [, options, callback])
Reset the cache time for key

**Options**
* `ttl`: reset the cache time to a specific value

## Use cases
### Cache data between the application and the database
Imaging that an application needs to talk to the database (MySQL, Postgresql etc...), and each time the latency is about 500-1000ms depends on the complexity of the query. So cache layer can be put between them to reduce the latency

Here is a simple example using `node-postgres`
```javascript
var pg = require('pg');
var conString = "postgres://postgres:1234@localhost/postgres";
var cache = require('./cache');

var query = 'SELECT $1::int AS numbor';

var fetch = function(ok) {
  pg.connect(conString, function(err, client, done) {
    if(err) {
      return ok(err);
    }
    client.query(query, ['1'], function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        return ok(err);
      }
      return ok(null, result.rows[0].numbor);
    });
  });
}

// we can just use the query as the cache key
// maybe hash it using md5 so we have smaller namespace
cache.fetch(query, fetch).done(function(numbor){
  //output: 1
  console.log(numbor);
}, handleError)
```

### Cache the whole web page
Another use case is to implement a simple cache middleware for express (or similar frameworks) to cache the page where possible

Here is another simple example
```javascript
var cacheLayer = function(req, res, next) {
  var key = req.url;

  var fetch = function() {
    var deferred = magicHappens();

    res.render('index', function(err, html){
      if (error) return deferred.reject(err);
      deferred.resolve(html);
    });
    // instead of simple page render, this could be a complex page with 
    // multiple queries to the database to get the related data

    return deferred.promise;
  }

  cache.fetch(key, fetch, function(error, html){
    if (error) {
      next(new Error(error));
    } else {
      // remember to set the correct headers
      res.end(html);
    }
  })
}
```

## Development
At the moment there are only several tests, more will be added later. Check `Gruntfile.js` and `package.json` for more information

## TODOs
* Support more cache storages such as `file`, `mongodb`, `couchbase` etc...
* Improve the performance where possible
* More tests
* More docs
* Somehow think of more ways to cache data instead of just `key-value` at the moment

## License
MIT