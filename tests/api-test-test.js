'use strict';

const { API, Handler } = require('@janiscommerce/api');
const { ApiSession } = require('@janiscommerce/api-session');

const assert = require('assert');

const { APITest, APITestError } = require('../lib');
const APITestCaller = require('..');

const makeHandler = api => (...args) => new Handler(api).handle(...args);

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
				.setHeaders({ 'some-header': '123' })
				.setCookies({ 'some-cookie': '321' })
				.setBody({ a: 2 })
				.setCode(200);
		}
	}

	class APIWithError5xx extends API {

		async process() {
			throw new Error('Some error');
		}
	}

	class APIWithError4xx extends API {

		async validate() {
			throw new Error('Some error');
		}
	}

	class APIClientClass extends API {

		async process() {

			const client = await this.session.client;
			delete client.getInstance;

			this
				.setBody({
					clientCode: this.session.clientCode,
					client
				})
				.setCode(200);
		}
	}

	const APIHandler = makeHandler(APIClass);
	const APICompleteHandler = makeHandler(APICompleteClass);
	const APIWithError5xxHandler = makeHandler(APIWithError5xx);
	const APIWithError4xxHandler = makeHandler(APIWithError4xx);
	const APIClientHandler = makeHandler(APIClientClass);

	APITestCaller(APIHandler, '/custom/path/to/my/api', [{
		description: 'Should response an empty body and a 200 http code using a endpoint',
		request: {},
		response: {
			code: 200,
			body: {}
		}
	}]);

	context('Rules validation will fail', () => {

		const notAnArray = [1, true, 'foo', { a: 1 }];
		const notAnObject = [1, true, 'foo', ['foo', 'bar']];
		const notAString = [1, true, ['foo', 'bar'], { foo: 'bar' }];
		const notANumber = ['foo', true, ['foo', 'bar'], { foo: 'bar' }];

		const notAnObjectNorBoolean = [1, 'foo', ['foo', 'bar']];

		it('when rules given aren\'t an array', () => {

			notAnArray.forEach(rules => {
				assert.throws(() => new APITest(APIHandler, rules), {
					message: 'Rules error - invalid format, must be an array',
					name: 'APITestError',
					code: APITestError.codes.INVALID_RULES
				});
			});
		});

		it('when rule is not an object', () => {

			const apiTest = new APITest(APIHandler);
			notAnObject.forEach(rule => {
				assert.throws(() => apiTest.validateRule(rule), {
					message: 'Rule error - must be an object',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_FORMAT
				});
			});
		});

		it('when rule description is missing', () => {

			const apiTest = new APITest(APIHandler);
			assert.throws(() => apiTest.validateRule({}), {
				message: 'Rule error - invalid description, must be a string',
				name: 'APITestError',
				code: APITestError.codes.RULE_INVALID_DESCRIPTION
			});
		});

		it('when rule description is not a string', () => {

			const apiTest = new APITest(APIHandler);
			notAString.forEach(description => {
				assert.throws(() => apiTest.validateRule({ description }), {
					message: 'Rule error - invalid description, must be a string',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_DESCRIPTION
				});
			});
		});

		it('when rule session is not an object nor a boolean', () => {

			const apiTest = new APITest(APIHandler);
			notAnObjectNorBoolean.forEach(session => {
				assert.throws(() => apiTest.validateRule({ description: 'foo', session }), {
					message: 'Rule error - invalid session, must be an object or a boolean',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_SESSION
				});
			});
		});


		it('when rule request is not an object', () => {

			const apiTest = new APITest(APIHandler);
			notAnObject.forEach(request => {
				assert.throws(() => apiTest.validateRule({ description: 'foo', request }), {
					message: 'Rule error - invalid request, must be an object',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_REQUEST
				});
			});
		});

		it('when rule request.rawData is not aa string', () => {

			const apiTest = new APITest(APIHandler);
			notAString.forEach(rawData => {
				assert.throws(() => apiTest.validateRule({ description: 'foo', request: { rawData } }), {
					message: 'Rule error - invalid request rawData, must be a string',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_REQUEST
				});
			});
		});

		it('when rule response is missing', () => {

			const apiTest = new APITest(APIHandler);
			assert.throws(() => apiTest.validateRule({ description: 'foo' }), {
				message: 'Rule error - invalid response, must be an object',
				name: 'APITestError',
				code: APITestError.codes.RULE_INVALID_RESPONSE
			});
		});

		it('when rule response is not an object', () => {

			const apiTest = new APITest(APIHandler);
			notAnObject.forEach(response => {
				assert.throws(() => apiTest.validateRule({ description: 'foo', response }), {
					message: 'Rule error - invalid response, must be an object',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE
				});
			});
		});

		it('when rule response code is not a number', () => {

			const apiTest = new APITest(APIHandler);
			notANumber.forEach(code => {

				assert.throws(() => apiTest.validateRule({
					description: 'foo',
					response: { code }
				}), {
					message: 'Rule error - invalid response code, must be a number',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_CODE
				});
			});
		});

		it('when rule response headers are not an object', () => {

			const apiTest = new APITest(APIHandler);
			notAnObject.forEach(headers => {

				assert.throws(() => apiTest.validateRule({
					description: 'foo',
					response: { headers }
				}), {
					message: 'Rule error - invalid response headers, must be an object',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_HEADERS
				});
			});
		});

		it('when rule response strict headers are not an object', () => {

			const apiTest = new APITest(APIHandler);
			notAnObject.forEach(strictHeaders => {

				assert.throws(() => apiTest.validateRule({
					description: 'foo',
					response: { strictHeaders }
				}), {
					message: 'Rule error - invalid response strict headers, must be an object',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_HEADERS
				});
			});
		});

		it('when rule response cookies are not an object', () => {

			const apiTest = new APITest(APIHandler);
			notAnObject.forEach(cookies => {

				assert.throws(() => apiTest.validateRule({
					description: 'foo',
					response: { cookies }
				}), {
					message: 'Rule error - invalid response cookies, must be an object',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_COOKIES
				});
			});
		});

		it('when rule response strict cookies are not an object', () => {

			const apiTest = new APITest(APIHandler);
			notAnObject.forEach(strictCookies => {

				assert.throws(() => apiTest.validateRule({
					description: 'foo',
					response: { strictCookies }
				}), {
					message: 'Rule error - invalid response strict cookies, must be an object',
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_COOKIES
				});
			});
		});
	});

	APITestCaller(APIHandler, [{
		description: 'Should response an empty body and a 200 http code',
		request: {},
		response: {
			code: 200,
			body: {}
		}
	}]);

	APITestCaller(APIWithError5xxHandler, [{
		description: 'Should response body with message and a 500 http code',
		request: {},
		response: {
			code: 500,
			body: { message: 'Some error' }
		}
	}]);

	APITestCaller(APIWithError4xxHandler, [{
		description: 'Should response body with message and a 400 http code',
		request: {},
		response: {
			code: 400,
			body: { message: 'Some error' }
		}
	}]);

	it('Should reject when response code doesn\'t match', async () => {

		const apiTest = new APITest(APIHandler);

		await assert.rejects(() => apiTest.assert({
			response: { code: 999 }
		}), {
			code: 'ERR_ASSERTION',
			actual: 200,
			expected: 999
		});
	});

	it('Should reject when response body doesn\'t match', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setBody(20);
			}
		}

		const MyAPIHandler = makeHandler(MyAPIClass);
		const apiTest = new APITest(MyAPIHandler);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, body: 10 }
		}), {
			code: 'ERR_ASSERTION',
			actual: 20,
			expected: 10
		});
	});

	it('Should reject when response headers doesn\'t match by name', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setHeader('my-header', '123');
			}
		}

		const MyAPIHandler = makeHandler(MyAPIClass);
		const apiTest = new APITest(MyAPIHandler);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, headers: { 'other-header': '123' } }
		}), {
			// the assert is assert(typeof response.headers[name] !== 'undefined');
			code: 'ERR_ASSERTION',
			actual: false,
			expected: true
		});
	});

	it('Should reject when response headers doesn\'t match by value', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setHeaders({ 'my-header': '123', 'other-header': '321' });
			}
		}

		const MyAPIHandler = makeHandler(MyAPIClass);
		const apiTest = new APITest(MyAPIHandler);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, headers: { 'my-header': '321' } }
		}), {
			// header found but with other value
			code: 'ERR_ASSERTION',
			actual: '123',
			expected: '321'
		});
	});

	it('Should reject when response headers doesn\'t match in strict mode', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setHeaders({ 'my-header': '123', 'other-header': '321' });
			}
		}

		const MyAPIHandler = makeHandler(MyAPIClass);
		const apiTest = new APITest(MyAPIHandler);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, strictHeaders: { 'my-header': '123' } }
		}), {
			// header found but with other value
			code: 'ERR_ASSERTION',
			actual: { 'my-header': '123', 'other-header': '321' },
			expected: { 'my-header': '123' }
		});
	});

	it('Should reject when response cookies doesn\'t match by name', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setCookie('my-cookie', '123');
			}
		}

		const MyAPIHandler = makeHandler(MyAPIClass);
		const apiTest = new APITest(MyAPIHandler);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, cookies: { 'other-cookie': '123' } }
		}), {
			// the assert is assert(typeof response.cookies[name] !== 'undefined');
			code: 'ERR_ASSERTION',
			actual: false,
			expected: true
		});
	});

	it('Should reject when response cookies doesn\'t match by value', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setCookies({ 'my-cookie': '123', 'other-cookie': '321' });
			}
		}

		const MyAPIHandler = makeHandler(MyAPIClass);
		const apiTest = new APITest(MyAPIHandler);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, cookies: { 'my-cookie': '321' } }
		}), {
			// cookie found but with other value
			code: 'ERR_ASSERTION',
			actual: '123',
			expected: '321'
		});
	});

	it('Should reject when response cookies doesn\'t match in strict mode', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setCookies({ 'my-cookie': '123' });
			}
		}

		const MyAPIHandler = makeHandler(MyAPIClass);
		const apiTest = new APITest(MyAPIHandler);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, strictCookies: {} }
		}), {
			// cookie found but with other value
			code: 'ERR_ASSERTION',
			actual: { 'my-cookie': '123' },
			expected: {}
		});
	});

	APITestCaller(APICompleteHandler, [{
		description: 'Should set response code, body, headers and cookie',
		before: () => {},
		after: () => {},
		request: {
			endpoint: 'custom-endpoint',
			data: { fooData: 1 },
			pathParameters: ['1', '2'],
			headers: { 'some-header': '123' },
			cookies: { 'some-cookie': '321' }
		},
		getResponse: () => {
			// do something great with the response received as a param
		},
		response: {
			code: 200,
			body: { a: 2 },
			strictHeaders: { 'some-header': '123' },
			strictCookies: { 'some-cookie': '321' }
		}
	}]);

	APITestCaller(APIClientHandler, [{
		description: 'Should set response code and body with default session\'s client',
		session: true,
		before: /** @param {import('sinon').SinonStatic} sinon */ sinon => {
			sinon.stub(ApiSession.prototype, 'client').value(Promise.resolve({ code: 'defaultClient', id: '507f191e810c19729de860ea' }));
		},
		request: {
			endpoint: 'custom-endpoint'
		},
		response: {
			code: 200,
			body: {
				clientCode: 'defaultClient',
				client: {
					code: 'defaultClient',
					id: '507f191e810c19729de860ea'
				}
			}
		}
	}]);

	APITestCaller(APIClientHandler, [{
		description: 'Should set response code, body with current injected client code',
		session: {
			clientId: '507f191e810c19729de860eb',
			clientCode: 'my-client-code'
		},
		before: /** @param {import('sinon').SinonStatic} sinon */ sinon => {
			sinon.stub(ApiSession.prototype, 'client').value(Promise.resolve({ code: 'my-client-code', id: '507f191e810c19729de860eb' }));
		},
		request: {
			endpoint: 'custom-endpoint'
		},
		response: {
			code: 200,
			body: {
				clientCode: 'my-client-code',
				client: {
					code: 'my-client-code',
					id: '507f191e810c19729de860eb'
				}
			}
		}
	}]);

});
