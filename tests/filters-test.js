/* global describe, it */

var assert = require('assert'),
    trisquel = require('../dist/trisquel'),
    i18n = {
      cancel: 'Cancel',
      accept: 'Accept',
      months: '${n} mes$if{n > 1}es{:}{/}',
      ok: 'gogogo',
      ko: 'whoops'
    };

trisquel.filter('i18n', function (key) {
  return i18n[key];
});

trisquel.filter('deutsche', function (wenn) {
  return wenn ? 'wenn' : 'keine';
});

describe('filters', function () {
  describe('i18n', function () {

    var scope = new trisquel.Scope();

    it('filter scope', function() {
      trisquel.filter('scope', function (foo) {
        assert.strictEqual(scope, this);
        return foo + 'bar';
      });
      assert.strictEqual(  trisquel('${ \'foo\' | scope }')(scope), 'foobar');
    });

    it('should use custom i18n command with scope', function() {
      assert.strictEqual(  trisquel('$i18n{ months:{ n: 5, i: { foo: \'bar\' } } }')(), '5 meses');
      assert.strictEqual(  trisquel('$i18n{ months:{ n: 1 } }')(), '1 mes');
    });

    it('should use custom i18n command with scope should fail', function() {
      assert.strictEqual(  trisquel('$i18n{ months:{ n: 5, i: { foo: \'bar\' } } }')(), '5 meses');
      assert.strictEqual(  trisquel('$i18n{ months:{ n: 1 } }')(), '1 mes');

      assert.throws(function () {
        trisquel('$i18n{ months:{ n: 1 } ')();
      }, /expression curly brackets mismatch/, 'did not throw with expected message');
    });

  });

  describe('filters in conditional expression', function () {

    it('if [or]', function() {
      assert.strictEqual( trisquel('$if{ true || false }gogogo{/}')(), 'gogogo');
    });

    it('if [or] filter (wenn)', function() {
      assert.strictEqual( trisquel('${ true || false | deutsche }')(), 'wenn');
    });

    it('if [or] filter (keine)', function() {
      assert.strictEqual( trisquel('${ false || false | deutsche }')(), 'keine');
    });

  });

});
