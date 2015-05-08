# Aspiring to build JSON Graph from Netflix's _Falcor_ #

As the team at [Netflix UI Engineering](https://www.youtube.com/channel/UCGGRRqAjPm6sL3-WGBDnKJA) work to bring _Falcor_ to the open source community, this is an effort to implement JSON Graph with a similar API as the public demonstrations while learning to use Karma and Jasmine.


## Inspiration and Architecture ##

Here's to [Jafar Husain](https://twitter.com/jhusain) and the Netflix team for sharing their experience:

  * [JSON Graph: Reactive REST at Netflix](http://applicative.acm.org/speaker-JafarHusain.html) -- 2015-02-26 @ Applicative
  * [Netflix JavaScript Talks - Falcor](https://www.youtube.com/watch?v=z8UgDZ4rXBU) -- 2015-04-16 @ Netflix


## Status ##
Unit tests are passing for reference evaluation and Model.get():
```JavaScript
karma start karma.conf.js
```

## Next Up ##

- [ ] Return a promise from Model.get/getValue (.then() syntax)
- [ ] Looks like Model.getValue(query) returns _just_ a single value
- [ ] ... and Model.get(query) returns the json: { ... } formatted data
- [ ] Clean up string tokenizing with a quick regex to the next . or [
- [ ] Setting the cache with an array in JSON arg maps to an associative array
- [ ] Model.set
        ```JavaScript
        model.setValue('genreLists[0].titles[0].rating', 17).then(function () {
            return model.get('genreLists[0..1].titles[0]["name","rating"]');
        }).then(log);
        ```
- [ ] Play with Observables


## Omitted ##

  - Server
  - RoutedSever
  - Building query strings to GET
  - Building optimized query strings for ID optimization, for example:
    ```JavaScript
    model.getValue('genreLists[0].titles[0].boxShot').then(log);
    ->
    GET [["titlesById",956,boxShot]]
    ```
  - Creating a new asynchronous view (t=45m)
    ```JavaScript
    member.bind('location ?
        then(locationModel  ?
            new LocationView( ? )
    ```
