# api-test

[![Build Status](https://travis-ci.org/janis-commerce/api-test.svg?branch=master)](https://travis-ci.org/janis-commerce/api-test)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api-test/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api-test?branch=master)

A package for testing APIs developed with [@janiscommerce/api](https://www.npmjs.com/package/@janiscommerce/api).
`api-test` should be used for testing purposes only, because allows you to test your APIs.

## Installation
```sh
npm install @janiscommerce/api-test --save-dev
```

## Usage
`api-test` is called with a function that receives an API class and an Array of rules.
For each rule, the module will create an `it()` block for creating an individual test.

```js
const APITest = require('@janiscommerce/api-test');
const MyAPIClass = require('path/to/my-api');

describe('MyAPI Tests', () => {

	APITest(MyAPIClass, [{
		description: 'should do something when other thing happend',
		request: {
			data: { foo: 123 }
		},
		response: {
			code: 200, // default
			body: { result: 1 }
		}
	}]);

});
```
## API Parameters
The api tester can receive 3 parameters
`MyAPIClass[, endpoint], rules`

- **MyAPIClass** *object*
The class to test

- **endpoint** *string* *[Optional]*
The endpoint that should use to run the test

- **rules** *array*
Array of test that will run individual.

```js
const APITest = require('@janiscommerce/api-test');
const MyAPIClass = require('path/to/my-api');

describe('MyAPI Tests', () => {

	APITest(MyAPIClass, '/path/to/my-api', [{
		description: 'should do something when other thing happend',
		request: {
			data: { foo: 123 },
			endpoint: '/custom/endpoint/for/current/test'
		},
		response: {
			code: 200, // default
			body: { result: 1 }
		}
	}]);

});
```

## Rule components
A rule is each test that will run individual.
These are the components of a rule.

- **description** *string*
The text that will be added in the `it()` function. This fields is required.

- **client** *object || boolean*
An object with the active client, or `true` to set a default client. If it's falsy, it won't inject the client.

- **request** *object*
An object with the request data. This field is

- **request.data** *object*
Optional data that the API will received.

- **request.endpoint** *string*
Optional endpoint that the execution has to use for that specific rule.

- **request.pathParameters** *object*
Optional pathParameters that the API will received.

- **request.headers** *object*
Optional headers that the API will received.

- **request.cookies** *object*
Optional cookies that the API will received.

- **response** *object*
The response. This field is required.

- **response.code** *number*
The response code expected. The default value is `200`.

- **response.headers** *object*
The response headers expected. This field is not strict. Will check each header individually.

- **response.strictHeaders** *object*
The response headers expected. This field is strict. Will check all headers given against all headers that the API will respond.

- **response.cookies** *object*
The response cookies expected. This field is not strict. Will check each cookie individually.

- **response.strictCookies** *object*
The response cookies expected. This field is strict. Will check all cookies given against all headers that the API will respond.

- **before** *function*
An optional function for configuring mocks or stubbing some things.
Receives a [sinon sandbox](https://sinonjs.org/releases/latest/sandbox/), this sanbox will be restored after each test (with `afterEach()` :wink:).
Example:
```js
{
	description: 'should get using the model and return 200 http response code',
	before: sandbox => {
		sandbox.stub(SomeModel.prototype, 'get');
	},
	response: { code: 200 }
};
```

- **getResponse** *function*
An optional function. Returns the response before the assertions. This is helpful for debugging reasons.
Example:
```js
{
	description: 'should return 200',
	getResponse: response => {
		console.log(response); // use this code for debugging if your test fail!
	},
	response: { code: 200 }
};
```

- **after** *function*
An optional function for testing additional stuff.
Receives the API response object and the [sinon sandbox](https://sinonjs.org/releases/latest/sandbox/).
Example:
```js
{
	description: 'should get using the model and return the formatted items',
	request: {
		data: { id: 1 }
	},
	before: sandbox => {
		sandbox.stub(SomeModel.prototype, 'get')
			.returns([{ foo: 1 }, { bar: 2 }]);
	},
	response: {
		body: [{
			foo: 1,
			formattedByAPI: true
		}, {
			bar: 2,
			formattedByAPI: true
		}]
	},
	after: (response, sandbox) => {
		sandbox.assert.calledOnce(SomeModel.prototype.get);
		sandbox.assert.calledWithExactly(SomeModel.prototype.get.getCall(0), { id: 1 });

		// do somthing nice with response...
	}
};
```

## Rule validation errors
When you configure a rule, `api-test` will throw an `APITestError` if there are a validation error.
These are the possible validation errors.

|Code|Description|
|--|--|
|1|Invalid Rules. It means that you didn't sent an array of rules.|
|2|Invalid Rule format. It means that you didn't sent an object for a rule.|
|3|Invalid Rule description. It means that the description is missing or isn't a string.|
|4|Invalid Rule request. It means that the request you sent was not an object.|
|5|Invalid Rule response. It means that the response is missing or was not an object.|
|6|Invalid Rule response code. It means that the response code you sent was not a number.|
|7|Invalid Rule response headers. It means that the response headers you sent was not an object.|
|8|Invalid Rule response cookies. It means that the response cookies you sent was not an object.|