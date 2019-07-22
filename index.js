'use strict';

const { APITest } = require('./lib');

module.exports = (APIClass, rules) => {
	const apiTest = new APITest(APIClass, rules);
	apiTest.test();
};
