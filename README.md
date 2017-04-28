# trisquel

Simple, customizable template engine for JavaScript

[![](https://img.shields.io/npm/v/trisquel.svg)](https://www.npmjs.com/package/trisquel)
[![Build Status](https://travis-ci.org/kiltjs/trisquel.svg?branch=master)](https://travis-ci.org/kiltjs/trisquel)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

### Installation

```.sh
npm install trisquel --save
```

> Example data

``` js
var data = {
  foo: 'bar',
  crash: {
    test: 'dummy'
  },
  list: ['foo', 'bar', 'foobar'],
  map: {
    hi: 'all',
    bye: 'nobody'
  }
};
```

#### Caching templates

``` js
template.put('partial-map', '$each{ item,key in map }[${foo}:${key}:${item}]{/}');

template.put('partial-list', '$each{ item,i in list }[${foo}:${i}:${item}]{/}');

// cached templates can be invoked with $include{}

console.log( template('$if{ foo !== \'bar\' }whoops{:}map: $include{\'partial-map\'} {/}', data) );
// returns 'map: [bar:hi:all][bar:bye:nobody]'

console.log( template('$if{ foo !== \'bar\' }whoops{:}list: $include{\'partial-list\'} {/}', data) );
// returns 'list: [bar:0:foo][bar:1:bar][bar:2:foobar]'
```

#### Filters

``` js

template.filter('months', function (nMonths) {
  return nMonths + (nMonths > 1 ? ' meses' : ' mes' );
});

console.log( template('${ nMonths | months }')({ nMonths: 5 }) );
// returns '5 meses'
console.log( template('${ nMonths | months }')({ nMonths: 1 }) );
// returns '1 mes'
```

``` js

var messages {
  greeting: template('Hi ${name}!')
};

template.filter('message', function (key, data) {
  return messages[key](data);
});

console.log( template('${ person.last_name }: ${ \'greeting\' | message: { name: person.first_name } }')({
  person: {
    first_name: 'John',
    last_name: 'Smith'
  }
}) );
// returns 'Smith: Hi John!'
```

#### Tests

``` sh
npm test
```

[![Build Status](https://travis-ci.org/kiltjs/trisquel.svg?branch=master)](https://travis-ci.org/kiltjs/trisquel) Travis

[![wercker status](https://app.wercker.com/status/281f306e7157005f0a21b770fbb81086/s "wercker status")](https://app.wercker.com/project/bykey/281f306e7157005f0a21b770fbb81086) Wercker
