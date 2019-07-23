'use strict';

const { Dispatcher } = require('@janiscommerce/api');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const APITestError = require('./api-test-error');

class APITest {

	constructor(APIClass, rules) {

		this.APIClass = APIClass;
		this.rules = rules || [];

		if(!Array.isArray(this.rules))
			throw new APITestError('Rules error - invalid format, must be an array', APITestError.codes.INVALID_RULES);
	}

	test() {

		afterEach(() => {
			sandbox.restore();
		});

		this.rules.forEach(rule => {
			this.validateRule(rule);
			it(rule.description, async () => this.assert(rule));
		});
	}

	validateRule(rule) {

		if(!this._isObject(rule))
			throw new APITestError('Rule error - must be an object', APITestError.codes.RULE_INVALID_FORMAT);

		if(typeof rule.description !== 'string')
			throw new APITestError('Rule error - invalid description, must be a string', APITestError.codes.RULE_INVALID_DESCRIPTION);

		if(typeof rule.request !== 'undefined' && (typeof rule.request !== 'object' || Array.isArray(rule.request)))
			throw new APITestError('Rule error - invalid request, must be an object', APITestError.codes.RULE_INVALID_REQUEST);

		// response...

		if(!this._isObject(rule.response))
			throw new APITestError('Rule error - invalid response, must be an object', APITestError.codes.RULE_INVALID_RESPONSE);

		if(typeof rule.response.code === 'undefined')
			rule.response.code = 200;
		else if(typeof rule.response.code !== 'number')
			throw new APITestError('Rule error - invalid response code, must be a number', APITestError.codes.RULE_INVALID_RESPONSE_CODE);

		if(typeof rule.response.headers !== 'undefined' && !this._isObject(rule.response.headers))
			throw new APITestError('Rule error - invalid response headers, must be an object', APITestError.codes.RULE_INVALID_RESPONSE_HEADERS);

		if(typeof rule.response.strictHeaders !== 'undefined' && !this._isObject(rule.response.strictHeaders))
			throw new APITestError('Rule error - invalid response strict headers, must be an object', APITestError.codes.RULE_INVALID_RESPONSE_HEADERS);

		if(typeof rule.response.cookies !== 'undefined' && !this._isObject(rule.response.cookies))
			throw new APITestError('Rule error - invalid response cookies, must be an object', APITestError.codes.RULE_INVALID_RESPONSE_COOKIES);

		if(typeof rule.response.strictCookies !== 'undefined' && !this._isObject(rule.response.strictCookies))
			throw new APITestError('Rule error - invalid response strict cookies, must be an object', APITestError.codes.RULE_INVALID_RESPONSE_COOKIES);
	}

	_isObject(value) {
		return typeof value === 'object' && !Array.isArray(value);
	}

	async assert(rule) {

		const dispatcher = new Dispatcher({ endpoint: 'foo' });
		dispatcher.api = this.prepareApi(rule);

		if(rule.before)
			rule.before(sandbox);

		await dispatcher.validate();

		await dispatcher.process();

		const response = dispatcher.response();

		assert.deepEqual(response.code, rule.response.code, 'Unexpected response code');

		if(rule.response.body)
			assert.deepEqual(response.body, rule.response.body, 'Unexpected response body');

		if(rule.response.strictHeaders)
			assert.deepEqual(response.headers, rule.response.strictHeaders, 'Unexpected response headers');

		if(rule.response.headers) {
			Object.entries(rule.response.headers).forEach(([name, value]) => {
				assert(typeof response.headers[name] !== 'undefined', `Header '${name}' not found in response`);
				assert.deepEqual(response.headers[name], value, `Header '${name}' value not equal`);
			});
		}

		if(rule.response.strictCookies)
			assert.deepEqual(response.cookies, rule.response.strictCookies, 'Unexpected response cookies');

		if(rule.response.cookies) {
			Object.entries(rule.response.cookies).forEach(([name, value]) => {
				assert(typeof response.cookies[name] !== 'undefined', `Cookie '${name}' not found in response`);
				assert.deepEqual(response.cookies[name], value, `Cookie '${name}' value not equal`);
			});
		}

		if(rule.after)
			rule.after(response, sandbox);
	}

	prepareApi(rule) {

		const api = new this.APIClass();

		if(rule.request) {
			api.data = rule.request.data;
			api.pathParameters = rule.request.pathParameters || [];
			api.headers = rule.request.headers;
			api.cookies = rule.request.cookies;
		}

		return api;
	}

}

module.exports = APITest;
