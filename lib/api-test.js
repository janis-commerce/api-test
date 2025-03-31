'use strict';

const assert = require('assert');
const sinon = require('sinon');

const APITestError = require('./api-test-error');

const defaultSessionData = {
	clientId: '507f191e810c19729de860ea',
	clientCode: 'defaultClient',
	serviceName: 'serviceName',
	userId: '607f191e810c19729de860ea',
	userIsDev: false,
	profileId: '707f191e810c19729de860ea',
	permissions: [
		'some-service:some-entity:some-action',
		'some-service:some-entity:some-other-action'
	],
	locations: ['807f191e810c19729de860ea', '907f191e810c19729de860ea'],
	warehousesIds: ['a07f191e810c19729de860ea', 'b07f191e810c19729de860ea'],
	hasAccessToAllLocations: false
};

const isObject = value => typeof value === 'object' && !Array.isArray(value);

/**
 * @typedef {object} RuleRequest
 * @property {string[]|Record<string,string>} [pathParameters]
 * @property {any} [data]
 * @property {string} [rawData]
 * @property {Object<string,string>} [headers]
 */

/**
 * @typedef {object} RuleResponse
 * @property {number} [code=200]
 * @property {Object<string,string>} [headers]
 * @property {Object<string,string>} [strictHeaders]
 * @property {Object<string,string>} [cookies]
 * @property {Object<string,string>} [strictCookies]
 * @property {any} [body]
 */


/**
 * @callback APITestBeforeFn
 * @param {sinon.SinonStatic} sinon
 * @returns {void}
 */

/**
 * @callback APITestAfterFn
 * @param {import('@janiscommerce/api').Response.RawResponsePayload} response
 * @param {sinon.SinonStatic} sinon
 * @returns {void}
 */

/**
 * @callback APITestGetResponseFn
 * @param {import('@janiscommerce/api').Response.RawResponsePayload} response
 * @returns {void}
 */

/**
 * @typedef {object} TestRule
 * @property {string} description
 * @property {boolean|import('@janiscommerce/api-session').ApiSession.AuthenticationData} [session]
 * @property {RuleRequest} [request]
 * @property {RuleResponse} [response]
 * @property {APITestBeforeFn} [before]
 * @property {APITestAfterFn} [after]
 * @property {APITestGetResponseFn} [getResponse] A debugging tool, to see the response before the assertions occur
 * @property {boolean} [only=false]
 */

/**
 * @callback ApiHandler
 * @param {import('@janiscommerce/api').Request.RawRequestEvent} event
 * @returns {Promise<import('@janiscommerce/api').Response.RawResponsePayload>}
 */

class APITest {

	/**
	 * @param {ApiHandler} apiHandler
	 * @param {string} endpoint
	 * @param {TestRule[]} rules
	 */
	constructor(apiHandler, endpoint, rules) {

		/** @type {ApiHandler} */
		this.apiHandler = apiHandler;
		/** @type {TestRule[]} */
		this.rules = this._maybeRules(rules || endpoint || []);
		/** @type {string} */
		this.endpoint = this._getEndpoint(endpoint);
	}

	/**
	 * @param {string|undefined} endpoint
	 * @returns {string}
	 */
	_getEndpoint(endpoint) {
		return typeof endpoint === 'string' ? endpoint : '';
	}

	/**
	 * @param {TestRule[]} rules
	 * @returns {TestRule[]}
	 */
	_maybeRules(rules) {

		if(!Array.isArray(rules))
			throw new APITestError('Rules error - invalid format, must be an array', APITestError.codes.INVALID_RULES);

		return rules;
	}

	test() {

		afterEach(() => {
			sinon.restore();
		});

		this.rules.forEach(rule => {

			this.validateRule(rule);

			// No se puede testear el it.only porque hace que no corra el resto de los tests
			/* istanbul ignore next */
			const tester = rule.only ? it.only : it;
			tester(rule.description, async () => this.assert(rule, this.endpoint));
		});
	}

	/**
	 * @param {TestRule} rule
	 */
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

	/**
	 * @param {TestRule} rule
	 * @param {string} defaultEndpoint
	 */
	async assert(rule, defaultEndpoint) {

		if(!rule.request)
			rule.request = {};

		if(!rule.request.endpoint)
			rule.request.endpoint = defaultEndpoint || 'default-endpoint';


		if(rule.before)
			rule.before(sinon);

		const request = this.generateRequest(rule);

		const response = await this.apiHandler(request);

		if(response.body) {
			try {
				response.body = JSON.parse(response.body);
			} catch(e) {
				// ignore if not valid JSON
			}
		}

		if(rule.getResponse)
			rule.getResponse(response);

		if(rule.response.body)
			assert.deepStrictEqual(response.body, rule.response.body, 'Unexpected response body');

		assert.deepStrictEqual(response.statusCode, rule.response.code, 'Unexpected response code');

		const { cookies, otherHeaders } = this.splitResponseHeaders(response.headers);

		if(rule.response.strictHeaders)
			assert.deepStrictEqual(otherHeaders, rule.response.strictHeaders, 'Unexpected response headers');

		if(rule.response.headers) {
			Object.entries(rule.response.headers).forEach(([name, value]) => {
				assert(typeof otherHeaders[name] !== 'undefined', `Header '${name}' not found in response`);
				assert.deepStrictEqual(otherHeaders[name], value, `Header '${name}' value not equal`);
			});
		}

		if(rule.response.strictCookies)
			assert.deepStrictEqual(cookies, rule.response.strictCookies, 'Unexpected response cookies');

		if(rule.response.cookies) {
			Object.entries(rule.response.cookies).forEach(([name, value]) => {
				assert(typeof cookies[name] !== 'undefined', `Cookie '${name}' not found in response`);
				assert.deepStrictEqual(cookies[name], value, `Cookie '${name}' value not equal`);
			});
		}

		if(rule.after)
			rule.after(response, sinon);
	}

	/**
	 * @param {TestRule} rule
	 * @returns {import('@janiscommerce/api').Request.RawRequestEvent}
	 */
	generateRequest(rule) {

		const pathParameters = this.generatePathParametersObject(rule);
		const headers = this.generateHeadersObject(rule);
		const authorizerData = this.generateAuthorizerData(rule);
		const principalId = this.generatePrincipalId(authorizerData);

		return {
			// Always sent as POST with body to avoid query encoding and parsing. Body is passed as-is.
			method: 'POST',
			body: rule.request.data,
			rawBody: rule.request.rawData || '',
			principalId,
			stage: 'local',
			headers,
			query: {},
			path: pathParameters,
			identity: {
				sourceIp: '0.0.0.0',
				userAgent: '@janiscommerce/api-test'
			},
			authorizer: {
				principalId,
				integrationLatency: '0',
				janisAuth: JSON.stringify(authorizerData)
			},
			stageVariables: {},
			requestContext: {},
			requestPath: rule.request.endpoint
		};
	}

	/**
	 * @param {TestRule} rule
	 * @returns {Record<string, string>}
	 */
	generatePathParametersObject(rule) {

		if(rule.request.pathParameters) {

			if(Array.isArray(rule.request.pathParameters)) {
				return rule.request.pathParameters.reduce((accum, pathParameter, index) => {
					accum[index] = pathParameter;
					return accum;
				}, {});
			}

			return rule.request.pathParameters;
		}

		return {};
	}

	/**
	 * @param {TestRule} rule
	 * @returns {Record<string, string>}
	 */
	generateHeadersObject(rule) {
		const headers = {
			...rule.request.headers
		};

		if(rule.request.cookies) {
			let cookieHeader = '';
			Object.entries(rule.request.cookies).forEach(([name, value]) => {
				cookieHeader += `${name}=${value}; `;
			});

			headers.Cookie = cookieHeader.trim();
		}

		return headers;
	}

	/**
	 * @param {TestRule} rule
	 * @returns {import('@janiscommerce/api-session').ApiSession.AuthenticationData}
	 */
	generateAuthorizerData(rule) {
		return rule.session === true ? defaultSessionData : rule.session;
	}

	/**
	 * @param {TestRule} rule
	 * @returns {string}
	 */
	generatePrincipalId(authorizerData = {}) {

		if(authorizerData.serviceName)
			return `service-${authorizerData.serviceName}`;

		if(authorizerData.userId) {
			if(authorizerData.isAdmin)
				return `user-admin-${authorizerData.userId}`;

			if(authorizerData.isDev)
				return `user-dev-${authorizerData.userId}`;

			return `user-${authorizerData.userId}`;
		}

		return '';
	}

	/**
	 * @param {Record<string, string>} headers
	 * @returns {{ cookies: Record<string, string>, otherHeaders: Record<string, string> }}
	 */
	splitResponseHeaders(headers) {

		let cookies = {};
		const otherHeaders = {};

		for(const [headerKey, headerValue] of Object.entries(headers)) {
			if(headerKey.toLowerCase() === 'set-cookie') {
				const [cookieName, ...cookieValue] = headerValue.split(';', 1)[0].split('=');
				cookies = { [cookieName]: cookieValue.join('=') };
			} else
				otherHeaders[headerKey] = headerValue;
		}

		return {
			cookies,
			otherHeaders
		};
	}

}

module.exports = APITest;
