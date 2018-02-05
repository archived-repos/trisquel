/* global describe, it, beforeEach */

var assert = require('assert'), data,
		trisquel = require('../dist/trisquel'),
		samplePartial = trisquel.put('sample', 'value: ${ foo }'),
		i18n = {
			cancel: 'Cancel',
			accept: 'Accept',
			months: '${n} mes$if{n > 1}es{:}{/}',
			ok: 'gogogo',
			ko: 'whoops'
		};

trisquel.cmd('i18n', function (scope, expression) {
		var splitted = expression.match(/([^:]*):(.*)/), locale, scopeExp;

		if( splitted ) {
			locale = i18n[splitted[1].trim()];
			scopeExp = splitted[2];
		} else {
			locale = i18n[expression.trim()];
		}

		if( typeof locale !== 'string' ) {
			return '{! ' + splitted[0].trim() + ' }';
		}

		if( scopeExp ) {
			return trisquel(locale)(scope.eval(scopeExp));
		}
		return locale;
	}, true);

trisquel.filter('i18n', function (key) {
	return i18n[key];
});

trisquel.filter('deutsche', function (wenn) {
	return wenn ? 'wenn' : 'keine';
});

beforeEach(function () {
	data = {
		fails: false,
		foo: 'bar',
		crash: {
			test: 'dummy'
		},
		list: ['foo', 'bar', 'foobar'],
		map: {
			hi: 'all',
			bye: 'nobody'
		},
		template: 'sample',
		label: {
			cancel: 'cancel'
		}
	};
});

describe('basic replace', function () {

	it('should replace value', function() {
		assert.strictEqual(
			trisquel( 'value: ${foo}')(data),
			'value: bar' );
  });

	it('should return if', function() {
		assert.strictEqual( trisquel('$if{ foo === \'bar\' }$i18n{ok}{:}$i18n{ok}{/}')(data), i18n.ok );
  });

  it('should return if (2)', function() {
		assert.strictEqual( trisquel('$if{ !fails }$i18n{ok}{/}')(data), i18n.ok );
  });

	it('should return otherwise', function() {
		assert.strictEqual( trisquel('$if{ foo !== \'bar\' }$i18n{ok}{:}$i18n{ko}{/}')(data), i18n.ko );
  });

	it('should return otherwise (2)', function() {
		assert.strictEqual( trisquel('$if{ foo !== \'bar\' }$i18n{ok}{:}{/}')(data), '' );
  });

});


describe('include', function () {

	it('should use sample partial', function() {
		assert.strictEqual( samplePartial(data), 'value: bar' );
  });

	it('should include sample partial', function() {
		assert.strictEqual( trisquel('$include{ sample }')(data), 'value: bar' );
  });

});

describe('includeEval', function () {

	it('should return if sample as string', function() {
		assert.strictEqual( trisquel('$if{ foo === \'bar\' }$includeEval{\'sample\'}{:}$i18n{ko}{/}')(data), 'value: bar' );
  });

	it('should return if sample as string', function() {
		assert.strictEqual( trisquel('$if{ foo === \'bar\' }$includeEval{ template }{:}$i18n{ko}{/}')(data), 'value: bar' );
  });

});


describe('each command', function () {

	it('should return list', function() {
		assert.strictEqual( trisquel('$each{ item in list },${item}{/}')(data), ',foo,bar,foobar');
  });

	it('should return list with index', function() {
		assert.strictEqual(  trisquel('$each{ item in list }[${$index}:${item}]{/}')(data), '[0:foo][1:bar][2:foobar]');
  });

	it('should return list with index', function() {
		assert.strictEqual(  trisquel('$each{ item,key in list }[${key}:${item}]{/}')(data), '[0:foo][1:bar][2:foobar]');
  });

	it('should return list with inheritance', function() {
		assert.strictEqual(  trisquel('$each{ item in list }[${ foo }:${ item }]{/}')(data), '[bar:foo][bar:bar][bar:foobar]');
  });

	it('should return map', function() {
		assert.strictEqual(  trisquel('$each{ item in map }[${ $key }:${ item }]{/}')(data), '[hi:all][bye:nobody]');
  });

	it('should return map with key', function() {
		assert.strictEqual(  trisquel('$each{ item, key in map }[${key}:${item}]{/}')(data), '[hi:all][bye:nobody]');
  });

	it('should return map with key and inheritance', function() {
		assert.strictEqual(  trisquel('$each{ item, key in map }[${foo}:${key}:${item}]{/}')(data), '[bar:hi:all][bar:bye:nobody]');
  });

});

describe('custom commands', function () {

	it('should add new command', function() {
		trisquel.cmd('double', function (scope, expression) {
			return Number(scope.eval(expression))*2;
		}, true);

		assert.strictEqual(  trisquel('$double{4}')(data), '8');
  });

	it('should use custom i18n command (helper)', function() {
		assert.strictEqual(  trisquel('$i18n{cancel}')(data), 'Cancel');
  });

	it('should use custom i18n command (helper) inside a condition', function() {
		assert.strictEqual(  trisquel('$if{ foo === \'bar\' }$i18n{cancel}{:}$i18n{accept}{/}, done!')(data), 'Cancel, done!');
  });

});

describe('filters', function () {

	it('filter i18n', function() {
		assert.strictEqual(  trisquel('${ \'cancel\' | i18n }')({}), 'Cancel');
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
