'use strict';

const { APITest } = require('./lib');

module.exports = (APIClass, endpoint, rules) => {
	const apiTest = new APITest(APIClass, endpoint, rules);
	apiTest.test();
};
