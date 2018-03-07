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

#### HTML Example

> src/index.html

``` html
<!DOCTYPE html>
<html lang="${ lang }">
  <head>
    <meta charset="utf-8">
    <title>Hello world</title>
  </head>
  <body>

  <p>Hi! My name is ${ profile.first_name }</p>

  <ul>
    $each{ text in list }<li>${ text }</li>{/}
  </ul>

  $if{ is_dev }
    <script type="application/javascript">
    (function (h,s) {
    s.type='text/javascript';s.src='//' + location.hostname + ':35729/livereload.js';h.appendChild(s);
    })(document.getElementsByTagName('head')[0], document.createElement('script') );
    </script>
  {/}
  </body>
</html>
```

> processing HTML

``` js
var fs = require('fs'),
    trisquel = require('trisquel');

var html = fs.readFileSync( 'src/index.html', { encoding: 'utf8' }),
    renderTemplate = trisquel(html);

fs.writeFileSync( 'public/index.html' , renderTemplate({
  lang: 'en-US',
  is_dev: true,
  profile: {
    first_name: 'John'
  },
  list: [
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
    'Aliquam tincidunt mauris eu risus.',
    'Vestibulum auctor dapibus neque.',
    'Nunc dignissim risus id metus.',
    'Cras ornare tristique elit.',
    'Vivamus vestibulum ntulla nec ante.',
    'Praesent placerat risus quis eros.',
    'Fusce pellentesque suscipit nibh.',
    'Integer vitae libero ac risus egestas placerat.',
    'Vestibulum commodo felis quis tortor.',
    'Ut aliquam sollicitudin leo.',
    'Cras iaculis ultricies nulla.',
    'Donec quis dui at dolor tempor interdum.',
  ]
}), { encoding: 'utf8' });

```

> Resulting HTML (public/index.html)

``` html
<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8">
    <title>Hello world</title>
  </head>
  <body>

  <p>Hi! My name is John</p>

  <ul>
    <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
    <li>Aliquam tincidunt mauris eu risus.</li>
    <li>Vestibulum auctor dapibus neque.</li>
    <li>Nunc dignissim risus id metus.</li>
    <li>Cras ornare tristique elit.</li>
    <li>Vivamus vestibulum ntulla nec ante.</li>
    <li>Praesent placerat risus quis eros.</li>
    <li>Fusce pellentesque suscipit nibh.</li>
    <li>Integer vitae libero ac risus egestas placerat.</li>
    <li>Vestibulum commodo felis quis tortor.</li>
    <li>Ut aliquam sollicitudin leo.</li>
    <li>Cras iaculis ultricies nulla.</li>
    <li>Donec quis dui at dolor tempor interdum.</li>
  </ul>


    <script type="application/javascript">
    (function (h,s) {
    s.type='text/javascript';s.src='//' + location.hostname + ':35729/livereload.js';h.appendChild(s);
    })(document.getElementsByTagName('head')[0], document.createElement('script') );
    </script>

  </body>
</html>
```
