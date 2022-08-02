'use strict';

const { APITest } = require('./lib');

/**
 * @param {import('@janiscommerce/api').API} APIClass
 * @param {string} endpoint
 * @param {import('./lib/api-test').TestRule[]} rules
 */
module.exports = (APIClass, endpoint, rules) => {
	const apiTest = new APITest(APIClass, endpoint, rules);
	apiTest.test();
};
