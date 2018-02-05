/* global describe, it */

var assert = require('assert'), data,
    trisquel = require('../dist/trisquel'),
    instance = new trisquel.Template(false),
    // samplePartial = trisquel.put('sample', 'value: ${ foo }'),
    locales = {
      cancel: 'Cancel',
      accept: 'Accept',
      months: '${n} mes$if{n > 1}es{:}{/}',
      ok: 'gogogo',
      ko: 'whoops'
    };

instance.cmd('message', function (scope, expression) {
    var splitted = expression.match(/([^:]*):(.*)/), locale, scopeExp;

    if( splitted ) {
      locale = locales[splitted[1].trim()];
      scopeExp = splitted[2];
    } else {
      locale = locales[expression.trim()];
    }

    if( typeof locale !== 'string' ) {
      return '{! ' + splitted[0].trim() + ' }';
    }

    if( scopeExp ) return trisquel(locale)(this.eval(scopeExp, scope));

    return locale;
  }, true);

instance.filter('message', function (key) {
  return locales[key];
});

describe('instances', function () {

  describe('instance command', function () {

    assert.throws(
      function () {
        trisquel('$message{ok}');
      },
      /cmd 'message' is not defined/
    );

    it('instance false', function() {
      assert.strictEqual( instance.compile('$message{ok}')(data), locales.ok );
    });

  });

  describe('instance filter', function () {

    assert.throws(
      function () {
        trisquel('${ \'ok\' | message }')(data);
      },
      /filter 'message' is not defined/
    );

    it('instance false', function() {
      assert.strictEqual( instance.compile('${ \'ok\' | message }')(data), locales.ok );
    });

  });

});
