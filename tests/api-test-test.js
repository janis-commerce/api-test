'use strict';

const { API } = require('@janiscommerce/api');

const assert = require('assert');

const { APITestError } = require('./../lib');
const APITestCaller = require('./..');

describe('APITest', async () => {

	class APIClass extends API {

		async process() {
			this
				.setBody({})
				.setCode(200);
		}
	}

	class APICompleteClass extends API {

		async process() {
			this
				.setBody({ a: 2 })
				.setCode(200);
		}
	}

	context('rules validation will fail', () => {

		it('when rules given aren\'t an array', () => {

			[1, true, 'foo', { a: 1 }].forEach(rules => {

				assert.throws(() => APITestCaller(APIClass, rules), {
					name: 'APITestError',
					code: APITestError.codes.INVALID_RULES
				});

			});
		});

		it('when rule is not an object', () => {

			[1, true, ['foo', 'bar']].forEach(rule => {
				assert.throws(() => APITestCaller(APIClass, [rule]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_FORMAT
				});
			});
		});

		it('when rule description is not a string', () => {

			[1, true, ['foo', 'bar'], { foo: 'bar' }].forEach(description => {
				assert.throws(() => APITestCaller(APIClass, [{ description }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_DESCRIPTION
				});
			});
		});

		it('when rule request is not an object', () => {

			[1, true, ['foo', 'bar']].forEach(request => {
				assert.throws(() => APITestCaller(APIClass, [{ description: 'foo', request }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_REQUEST
				});
			});
		});

		it('when rule response is not an object', () => {

			[1, true, ['foo', 'bar']].forEach(response => {
				assert.throws(() => APITestCaller(APIClass, [{ description: 'foo', response }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE
				});
			});
		});

		it('when rule response code is not a number', () => {

			['foo', true, ['foo', 'bar'], { foo: 'bar' }].forEach(code => {

				const rules = [{
					description: 'foo',
					response: { code }
				}];

				assert.throws(() => APITestCaller(APIClass, rules), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_CODE
				});
			});
		});

	});

	APITestCaller(APIClass, [{
		description: 'foo',
		prepare: () => {},
		request: {},
		response: {
			body: {}
		}
	}]);

	APITestCaller(APICompleteClass, [{
		description: 'bar',
		prepare: () => {},
		request: {
			data: { fooData: 1 },
			pathParameters: [1, 2],
			headers: { 'some-header': 123 },
			cookies: { 'some-cookie': 321 }
		},
		response: {
			body: { a: 2 }
		}
	}]);

});
