'use strict';

const { Dispatcher } = require('@janiscommerce/api');
const { ApiSession } = require('@janiscommerce/api-session');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const APITestError = require('./api-test-error');

const defaultClient = {
	id: 1,
	code: 'defaultClient'
};

const defaultSessionData = {
	clientId: 1,
	clientCode: 'defaultClient',
	userId: 2,
	profileId: 3,
	permissions: [
		'some-service:some-entity:some-action',
		'some-service:some-entity:some-other-action'
	],
	userIsDev: false,
	locations: ['location-1', 'location-2'],
	hasAccessToAllLocations: false
};

const isObject = value => typeof value === 'object' && !Array.isArray(value);

/**
 * @typedef {object} ClientData
 * @property {string} id
 * @property {string} code
 */

/**
 * @typedef {object} RuleRequest
 * @property {string[]} [pathParameters]
 * @property {*} [data]
 * @property {string} [rawData]
 * @property {Object<string,string>} headers
 */

/**
 * @typedef {object} RuleResponse
 * @property {number} [code=200]
 * @property {Object<string,string>} headers
 * @property {Object<string,string>} strictHeaders
 * @property {Object<string,string>} cookies
 * @property {Object<string,string>} strictCookies
 * @property {*} [body]
 */

/**
 * @typedef {object} APIResponse
 * @property {number} code
 * @property {Object<string,string>} headers
 * @property {Object<string,string>} cookies
 * @property {*} body
 */

/**
 * @callback APITestBeforeFn
 * @param {import('sinon')} sinon
 * @returns {void}
 */

/**
 * @callback APITestAfterFn
 * @param {APIResponse} response
 * @param {import('sinon')} sinon
 * @returns {void}
 */

/**
 * @typedef {object} TestRule
 * @property {string} description
 * @property {boolean|import('@janiscommerce/api-session').ApiSession.AuthenticationData} [session]
 * @property {boolean|ClientData} [client]
 * @property {RuleRequest} [request]
 * @property {RuleResponse} [response]
 * @property {APITestBeforeFn} [before]
 * @property {APITestAfterFn} [after]
 */

class APITest {

	/**
	 * @param {import('@janiscommerce/api').API} APIClass
	 * @param {string} endpoint
	 * @param {TestRule[]} rules
	 */
	constructor(APIClass, endpoint, rules) {

		this.APIClass = APIClass;
		this.rules = this._maybeRules(rules || endpoint || []);
		this.endpoint = this._getEndpoint(endpoint);
	}

	_getEndpoint(endpoint) {
		return typeof endpoint === 'string' ? endpoint : '';
	}

	_maybeRules(rules) {

		if(!Array.isArray(rules))
			throw new APITestError('Rules error - invalid format, must be an array', APITestError.codes.INVALID_RULES);

		return rules;
	}

	test() {

		afterEach(() => {
			sandbox.restore();
		});

		this.rules.forEach(rule => {

			this.validateRule(rule);

			// No se puede testear el it.only porque hace que no corra el resto de los tests
			/* istanbul ignore next */
			const tester = rule.only ? it.only : it;
			tester(rule.description, async () => this.assert(rule, this.endpoint));
		});
	}

	validateRule(rule) {

		if(!isObject(rule))
			throw new APITestError('Rule error - must be an object', APITestError.codes.RULE_INVALID_FORMAT);

		if(typeof rule.description !== 'string')
			throw new APITestError('Rule error - invalid description, must be a string', APITestError.codes.RULE_INVALID_DESCRIPTION);

		if(typeof rule.request !== 'undefined' && !isObject(rule.request))
			throw new APITestError('Rule error - invalid request, must be an object', APITestError.codes.RULE_INVALID_REQUEST);

		if(rule.request && typeof rule.request.rawData !== 'undefined' && typeof rule.request.rawData !== 'string')
			throw new APITestError('Rule error - invalid request rawData, must be a string', APITestError.codes.RULE_INVALID_REQUEST);

		if(typeof rule.session !== 'undefined' && typeof rule.session !== 'boolean' && !isObject(rule.session))
			throw new APITestError('Rule error - invalid session, must be an object or a boolean', APITestError.codes.RULE_INVALID_SESSION);

		if(typeof rule.client !== 'undefined' && !isObject(rule.client))
			throw new APITestError('Rule error - invalid client, must be an object', APITestError.codes.RULE_INVALID_CLIENT);

		if(!isObject(rule.response))
			throw new APITestError('Rule error - invalid response, must be an object', APITestError.codes.RULE_INVALID_RESPONSE);

		if(typeof rule.response.code === 'undefined')
			rule.response.code = 200;
		else if(typeof rule.response.code !== 'number')
			throw new APITestError('Rule error - invalid response code, must be a number', APITestError.codes.RULE_INVALID_RESPONSE_CODE);

		if(typeof rule.response.headers !== 'undefined' && !isObject(rule.response.headers))
			throw new APITestError('Rule error - invalid response headers, must be an object', APITestError.codes.RULE_INVALID_RESPONSE_HEADERS);

		if(typeof rule.response.strictHeaders !== 'undefined' && !isObject(rule.response.strictHeaders))
			throw new APITestError('Rule error - invalid response strict headers, must be an object', APITestError.codes.RULE_INVALID_RESPONSE_HEADERS);

		if(typeof rule.response.cookies !== 'undefined' && !isObject(rule.response.cookies))
			throw new APITestError('Rule error - invalid response cookies, must be an object', APITestError.codes.RULE_INVALID_RESPONSE_COOKIES);

		if(typeof rule.response.strictCookies !== 'undefined' && !isObject(rule.response.strictCookies))
			throw new APITestError('Rule error - invalid response strict cookies, must be an object', APITestError.codes.RULE_INVALID_RESPONSE_COOKIES);
	}

	async assert(rule, defaultEndpoint) {

		if(!rule.request)
			rule.request = {};

		if(!rule.request.endpoint)
			rule.request.endpoint = defaultEndpoint || 'default-endpoint';

		let response;

		try {

			const dispatcher = new Dispatcher({ endpoint: rule.request.endpoint });
			dispatcher.api = this.prepareApi(rule);

			if(rule.before)
				rule.before(sandbox);

			await dispatcher.validate();

			await dispatcher.process();

			response = dispatcher.response();

		} catch({ body, message, statusCode }) {

			response = {
				code: statusCode,
				body: body || { message }
			};

		}


		if(rule.getResponse)
			rule.getResponse(response);

		if(rule.response.body)
			assert.deepStrictEqual(response.body, rule.response.body, 'Unexpected response body');

		assert.deepStrictEqual(response.code, rule.response.code, 'Unexpected response code');

		if(rule.response.strictHeaders)
			assert.deepStrictEqual(response.headers, rule.response.strictHeaders, 'Unexpected response headers');

		if(rule.response.headers) {
			Object.entries(rule.response.headers).forEach(([name, value]) => {
				assert(typeof response.headers[name] !== 'undefined', `Header '${name}' not found in response`);
				assert.deepStrictEqual(response.headers[name], value, `Header '${name}' value not equal`);
			});
		}

		if(rule.response.strictCookies)
			assert.deepStrictEqual(response.cookies, rule.response.strictCookies, 'Unexpected response cookies');

		if(rule.response.cookies) {
			Object.entries(rule.response.cookies).forEach(([name, value]) => {
				assert(typeof response.cookies[name] !== 'undefined', `Cookie '${name}' not found in response`);
				assert.deepStrictEqual(response.cookies[name], value, `Cookie '${name}' value not equal`);
			});
		}

		if(rule.after)
			rule.after(response, sandbox);
	}

	prepareApi(rule) {

		const api = new this.APIClass();

		api.data = rule.request.data || {};
		api.rawData = rule.request.rawData;
		api.pathParameters = rule.request.pathParameters || [];
		api.headers = rule.request.headers || {};
		api.cookies = rule.request.cookies || {};
		api.endpoint = rule.request.endpoint;

		if(rule.session) {
			const client = rule.client && typeof rule.client === 'object' ? rule.client : defaultClient;
			api.session = new ApiSession({ ...(rule.session === true ? defaultSessionData : rule.session) }, client);
		}

		return api;
	}

}

module.exports = APITest;
