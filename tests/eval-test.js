/* global describe, it */

var assert = require('assert'),
    trisquel = require('../dist/trisquel'),
    template = new trisquel.Trisquel(),
    messages = {
      yes: 'Yes',
      no: 'No',
    };

template.filter('lowercase', function (value) {
  return value.toLowerCase();
});

template.filter('uppercase', function (value) {
  return value.toUpperCase();
});

template.cmd('message', function (scope, expression) {
  return this.eval(expression, scope, function (key) {
    return messages[key] || ('{! ' + key + ' }');
  }, true);
}, true);

describe('eval', function () {

  [
    ['$message{ yes }', 'Yes'],
    ['$message{ yes | lowercase }', 'yes'],
    ['$message{ yes | uppercase }', 'YES'],
    ['$message{ yes | lowercase | uppercase }', 'YES'],
    ['$message{ yes | uppercase | lowercase }', 'yes'],
    ['$message{ 404.error | uppercase }', '{! 404.ERROR }'],
  ].forEach(function (pair) {
    it(pair[0] + ' -> ' + pair[1], function() {
      assert.strictEqual( template.compile(pair[0])(), pair[1]);
    });
  });

});
