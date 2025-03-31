'use strict';

const { APITest } = require('./lib');

/**
 * @param {import('./lib/api-test').ApiHandler|{ handler:import('./lib/api-test').ApiHandler }} apiHandler
 * @param {string} endpoint
 * @param {import('./lib/api-test').TestRule[]} rules
 */
module.exports = (apiHandler, endpoint, rules) => {
	const apiTest = new APITest(typeof apiHandler === 'function' ? apiHandler : apiHandler.handler, endpoint, rules);
	apiTest.test();
};
