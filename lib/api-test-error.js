'use strict';

class APITestError extends Error {

	static get codes() {

		return {
			INVALID_RULES: 1,
			RULE_INVALID_FORMAT: 2,
			RULE_INVALID_DESCRIPTION: 3,
			RULE_INVALID_REQUEST: 4,
			RULE_INVALID_RESPONSE: 5,
			RULE_INVALID_RESPONSE_CODE: 6,
			RULE_INVALID_RESPONSE_HEADERS: 7,
			RULE_INVALID_RESPONSE_COOKIES: 8,
			RULE_INVALID_SESSION: 9,
			RULE_INVALID_CLIENT: 10
		};

	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'APITestError';
	}
}

module.exports = APITestError;
