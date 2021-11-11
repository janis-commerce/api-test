'use strict';

const { API } = require('@janiscommerce/api');

const assert = require('assert');

const { APITest, APITestError } = require('../lib');
const APITestCaller = require('..');

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
				.setHeaders({ 'some-header': 123 })
				.setCookies({ 'some-cookie': 321 })
				.setBody({ a: 2 })
				.setCode(200);
		}
	}

	APITestCaller(APIClass, '/custom/path/to/my/api', [{
		description: 'Should response an empty body and a 200 http code using a endpoint',
		prepare: () => {},
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
				assert.throws(() => APITestCaller(APIClass, rules), {
					name: 'APITestError',
					code: APITestError.codes.INVALID_RULES
				});
			});
		});

		it('when rule is not an object', () => {

			notAnObject.forEach(rule => {
				assert.throws(() => APITestCaller(APIClass, [rule]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_FORMAT
				});
			});
		});

		it('when rule description is missing', () => {

			assert.throws(() => APITestCaller(APIClass, [{}]), {
				name: 'APITestError',
				code: APITestError.codes.RULE_INVALID_DESCRIPTION
			});
		});

		it('when rule description is not a string', () => {

			notAString.forEach(description => {
				assert.throws(() => APITestCaller(APIClass, [{ description }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_DESCRIPTION
				});
			});
		});

		it('when rule session is not an object nor a boolean', () => {

			notAnObjectNorBoolean.forEach(session => {
				assert.throws(() => APITestCaller(APIClass, [{ description: 'foo', session }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_SESSION
				});
			});
		});

		it('when client request is not an object', () => {

			notAnObject.forEach(async client => {
				assert.throws(() => APITestCaller(APIClass, [{ description: 'foo', client }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_CLIENT
				});
			});
		});

		it('when rule request is not an object', () => {

			notAnObject.forEach(request => {
				assert.throws(() => APITestCaller(APIClass, [{ description: 'foo', request }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_REQUEST
				});
			});
		});

		it('when rule request.rawData is not aa string', () => {

			notAString.forEach(rawData => {
				assert.throws(() => APITestCaller(APIClass, [{ description: 'foo', request: { rawData } }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_REQUEST
				});
			});
		});

		it('when rule response is missing', () => {
			assert.throws(() => APITestCaller(APIClass, [{ description: 'foo' }]), {
				name: 'APITestError',
				code: APITestError.codes.RULE_INVALID_RESPONSE
			});
		});

		it('when rule response is not an object', () => {

			notAnObject.forEach(response => {
				assert.throws(() => APITestCaller(APIClass, [{ description: 'foo', response }]), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE
				});
			});
		});

		it('when rule response code is not a number', () => {

			notANumber.forEach(code => {

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

		it('when rule response headers are not an object', () => {

			notAnObject.forEach(headers => {

				const rules = [{
					description: 'foo',
					response: { headers }
				}];

				assert.throws(() => APITestCaller(APIClass, rules), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_HEADERS
				});
			});
		});

		it('when rule response strict headers are not an object', () => {

			notAnObject.forEach(strictHeaders => {

				const rules = [{
					description: 'foo',
					response: { strictHeaders }
				}];

				assert.throws(() => APITestCaller(APIClass, rules), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_HEADERS
				});
			});
		});

		it('when rule response cookies are not an object', () => {

			notAnObject.forEach(cookies => {

				const rules = [{
					description: 'foo',
					response: { cookies }
				}];

				assert.throws(() => APITestCaller(APIClass, rules), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_COOKIES
				});
			});
		});

		it('when rule response strict cookies are not an object', () => {

			notAnObject.forEach(strictCookies => {

				const rules = [{
					description: 'foo',
					response: { strictCookies }
				}];

				assert.throws(() => APITestCaller(APIClass, rules), {
					name: 'APITestError',
					code: APITestError.codes.RULE_INVALID_RESPONSE_COOKIES
				});
			});
		});
	});

	APITestCaller(APIClass, [{
		description: 'Should response an empty body and a 200 http code',
		prepare: () => {},
		request: {},
		response: {
			code: 200,
			body: {}
		}
	}]);

	it('Should reject when response codes doesn\'t match', async () => {

		const apiTest = new APITest(APIClass);

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

		const apiTest = new APITest(MyAPIClass);

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
				this.setHeader('my-header', 123);
			}
		}

		const apiTest = new APITest(MyAPIClass);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, headers: { 'other-header': 123 } }
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
				this.setHeaders({ 'my-header': 123, 'other-header': 321 });
			}
		}

		const apiTest = new APITest(MyAPIClass);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, headers: { 'my-header': 321 } }
		}), {
			// header found but with other value
			code: 'ERR_ASSERTION',
			actual: 123,
			expected: 321
		});
	});

	it('Should reject when response headers doesn\'t match in strict mode', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setHeaders({ 'my-header': 123, 'other-header': 321 });
			}
		}

		const apiTest = new APITest(MyAPIClass);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, strictHeaders: { 'my-header': 123 } }
		}), {
			// header found but with other value
			code: 'ERR_ASSERTION',
			actual: { 'my-header': 123, 'other-header': 321 },
			expected: { 'my-header': 123 }
		});
	});

	it('Should reject when response cookies doesn\'t match by name', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setCookie('my-cookie', 123);
			}
		}

		const apiTest = new APITest(MyAPIClass);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, cookies: { 'other-cookie': 123 } }
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
				this.setCookies({ 'my-cookie': 123, 'other-cookie': 321 });
			}
		}

		const apiTest = new APITest(MyAPIClass);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, cookies: { 'my-cookie': 321 } }
		}), {
			// cookie found but with other value
			code: 'ERR_ASSERTION',
			actual: 123,
			expected: 321
		});
	});

	it('Should reject when response cookies doesn\'t match in strict mode', async () => {

		class MyAPIClass extends API {
			async process() {
				this.setCookies({ 'my-cookie': 123, 'other-cookie': 321 });
			}
		}

		const apiTest = new APITest(MyAPIClass);

		await assert.rejects(() => apiTest.assert({
			response: { code: 200, strictCookies: { 'my-cookie': 123 } }
		}), {
			// cookie found but with other value
			code: 'ERR_ASSERTION',
			actual: { 'my-cookie': 123, 'other-cookie': 321 },
			expected: { 'my-cookie': 123 }
		});
	});

	APITestCaller(APICompleteClass, [{
		description: 'Should set response code, body, headers and cookie',
		before: () => {},
		after: () => {},
		request: {
			endpoint: 'custom-endpoint',
			data: { fooData: 1 },
			pathParameters: [1, 2],
			headers: { 'some-header': 123 },
			cookies: { 'some-cookie': 321 }
		},
		getResponse: () => {
			// do something great with the response received as a param
		},
		response: {
			code: 200,
			body: { a: 2 },
			strictHeaders: { 'some-header': 123 },
			strictCookies: { 'some-cookie': 321 }
		}
	}]);

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

	APITestCaller(APIClientClass, [{
		description: 'Should set response code and body with default session\'s client',
		session: true,
		request: {
			endpoint: 'custom-endpoint'
		},
		response: {
			code: 200,
			body: {
				clientCode: 'defaultClient',
				client: {
					code: 'defaultClient',
					id: 1
				}
			}
		}
	}]);

	APITestCaller(APIClientClass, [{
		description: 'Should set response code, body with current injected client code',
		session: {
			clientId: 1,
			clientCode: 'my-client-code'
		},
		request: {
			endpoint: 'custom-endpoint'
		},
		response: {
			code: 200,
			body: {
				clientCode: 'my-client-code',
				client: {
					code: 'defaultClient',
					id: 1
				}
			}
		}
	}]);

	APITestCaller(APIClientClass, [{
		description: 'Should set response code, body with current injected client code and client',
		session: {
			clientId: 1,
			clientCode: 'my-client-code'
		},
		client: {
			id: 1,
			code: 'my-client-code',
			customField: true
		},
		request: {
			endpoint: 'custom-endpoint'
		},
		response: {
			code: 200,
			body: {
				clientCode: 'my-client-code',
				client: {
					id: 1,
					code: 'my-client-code',
					customField: true
				}
			}
		}
	}]);

});
