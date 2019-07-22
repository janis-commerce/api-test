'use strict';

const { Dispatcher } = require('@janiscommerce/api');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const APITestError = require('./api-test-error');

class APITest {

	get defaultRules() {
		return [

		];
	}

	constructor(APIClass, rules) {

		this.APIClass = APIClass;
		this.rules = rules || [];

		if(!Array.isArray(this.rules))
			throw new APITestError('Rules error - invalid format, must be an array', APITestError.codes.INVALID_RULES);

		this.rules = [...this.defaultRules, ...this.rules];
	}

	test() {

		afterEach(() => {
			sandbox.restore();
		});

		this.rules.map(rule => this.testRule(rule));
	}

	testRule(rule) {

		this.validateRule(rule);

		const dispatcher = new Dispatcher({ endpoint: 'foo' });
		dispatcher.api = this.prepareApi(rule);

		it(rule.description, async () => {

			if(rule.prepare)
				rule.prepare(sandbox);

			await dispatcher.validate();

			await dispatcher.process();

			const response = dispatcher.response();

			assert.deepEqual(response.code, rule.response.code, 'Unexpected response code');

			if(rule.response.body)
				assert.deepEqual(response.body, rule.response.body, 'Unexpected response body');

			if(rule.response.headers)
				assert.deepEqual(response.headers, rule.response.headers, 'Unexpected response headers');

			if(rule.response.cookies)
				assert.deepEqual(response.cookies, rule.response.cookies, 'Unexpected response cookies');
		});
	}

	validateRule(rule) {

		if(typeof rule !== 'object' || Array.isArray(rule))
			throw new APITestError('Rule error - must be an object', APITestError.codes.RULE_INVALID_FORMAT);

		if(typeof rule.description !== 'string')
			throw new APITestError('Rule error - invalid description, must be a string', APITestError.codes.RULE_INVALID_DESCRIPTION);

		if(typeof rule.request !== 'undefined' && (typeof rule.request !== 'object' || Array.isArray(rule.request)))
			throw new APITestError('Rule error - invalid request, must be an object', APITestError.codes.RULE_INVALID_REQUEST);

		if(typeof rule.response !== 'object' || Array.isArray(rule.response))
			throw new APITestError('Rule error - invalid response, must be an object', APITestError.codes.RULE_INVALID_RESPONSE);

		if(typeof rule.response.code === 'undefined')
			rule.response.code = 200;
		else if(typeof rule.response.code !== 'number')
			throw new APITestError('Rule error - invalid response code, must be a number', APITestError.codes.RULE_INVALID_RESPONSE_CODE);
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
