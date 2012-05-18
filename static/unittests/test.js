//
//	Auto testing for client side infrastructure
//


var NumTests = 0;
var NumFailed = 0;
var Test = function(title, subject, testFunction, args, expectedResult) {
	NumTests += 1;
	// If the test was successful...
	if (testFunction.apply(subject, args) === expectedResult) {
		$('body').append($('<div>').text(title + '... Passed'));
	// Otherwise...
	} else {
		NumFailed += 1;
		$('body').append(
			$('<div>')
				.text(title + '... Failed')
				.append(
					$('<div>').text('Test data: ' + args)
				)
				.append(
					$('<div>')
						.text('Expect: ' + expectedResult + ', but got: ' + testFunction.apply(subject, args))
				)
		);
		console.log('testData:');
		console.log(args);
		console.log('expected:');
		console.log(expectedResult);
		console.log('got: ');
		console.log(testFunction.apply(subject, args));
	}
}

var Title = function(packageName) {
	$('body').append($('<h3>').text(packageName));
}
var Model = {}
$(document).ready(function() {
	Title('checkEqual');
	var TestCheckEqual = function(title, args, expectedResult) {
		Test(title, {}, checkEqual, args, expectedResult);
	}
	// Primitive types
	// Number
	TestCheckEqual('check integer equals', [2, 2], true);
	TestCheckEqual('check integer unequals', [1, 0], false);
	// String
	TestCheckEqual('check string equals', ['abc 123_', 'abc 123_'], true);
	TestCheckEqual('check string unequals', ['abcd 123_', 'abc 123_'], false);
	// Other types
	TestCheckEqual('check null/undefined unequals', [null, undefined], false);
	TestCheckEqual('check boolean unequals', [true, false], false);

	// Simple Array
	TestCheckEqual('check simple array equals', [[1, 'a', 2], [1, 'a', 2]], true);
	TestCheckEqual('check simple array unequals', [[1, 'a', 3], [1, 'a', 2]], false);
	TestCheckEqual('check simple array different length', [[1, 'a', 3], [1, 'a']], false);
	TestCheckEqual('check empty array', [[], []], true);
	
	// Simple Object
	TestCheckEqual('check empty object', [{}, {}], true);
	TestCheckEqual('check simple object equals', [{'a': 1, 'b': 'hi', 'c': 'yo'}, {'a': 1, 'c': 'yo', 'b': 'hi'}], true);
	TestCheckEqual('check simple object unequals', [{'a': 1, 'b': 'hi'}, {'a': 1, 'b': 'hello'}], false);
	TestCheckEqual('check simple object different keys', [{'a': 1}, {'a': 1, 'b': 'hi'}], false);
	
	// Complex arrays
	// Array of arrays
	TestCheckEqual('check array of arrays equals', [
					[[1, 2, 'a'], 3, 'b', [3, 'a']], 
					[[1, 2, 'a'], 3, 'b', [3, 'a']]], true);
	TestCheckEqual('check array of arrays unequals', [
					[[1, 2, 'a'], 3, 'b', [3, 'a', 'c']], 
					[[1, 2, 'a'], 3, 'b', [3, 'a']]], false);
	TestCheckEqual('check array of arrays unequals with empty subarray', [
					[[1, 2, 'a'], 3, 'b', [3, 'a'], []], 
					[[1, 2, 'a'], 3, 'b', [3, 'a']]], false);
	// Array of Objects
	TestCheckEqual('check array of objects equal', [
					[1, {'b': 2, 'c': 'd'}],
					[1, {'c': 'd', 'b': 2}]], true);
	TestCheckEqual('check array of objects unequal', [
					[1, {'b': 2, 'c': 'e'}],
					[1, {'b': 2, 'c': 'd'}]], false);
					
	// Model.model
	Title('Model');
	var assertEquals = function(a, b) {
		return checkEqual(a, b);
	}	
	var m1 = new Model.model();
	var TestModel = function(title, model, functionName, args, expectedResult) {
		Test(title, {}, function() { return assertEquals(model[functionName].apply({}, args), expectedResult);}, [], true);
	}
	// Test if data starts by being empty
	TestModel('test get empty data', m1, 'get', [], undefined);
	// Test whether data is set after a set method
	m1.set(2);
	TestModel('test get after set', m1, 'get', [], 2);
	// Test the function of getting an element from data by ID
	m1.set([{id: 1, content: 'a'}, {id:3, content: 'd'}]);
	TestModel('test get by id', m1, 'getById', [1], {content: 'a', id: 1});
	// Test the listener function of model
	var TestModelListener = function(title, dummyOutput, expectedResult) {
		Test(title, {}, assertEquals, [dummyOutput, expectedResult], true);
	}
	var dummyFunctionConstructor = function(timesCalled) {
		return function(data) {
			if (data !== undefined) timesCalled += 1;
			else return timesCalled;
		}
	}
	var dummy1 = dummyFunctionConstructor(0);
	TestModelListener('test dummy function initialized', dummy1(), 0);
	// Should fire once when bound
	m1.bind(dummy1);
	TestModelListener('test fire when bound', dummy1(), 1);
	TestModelListener('test not fire when not bound', dummy1(), 1);
	// Set data should fire the dummy
	m1.set('a');
	TestModelListener('test fire when new data set', dummy1(), 2);
	// Should not fire if data did not actually change
	m1.set('a');
	TestModelListener('test not fire when same data set', dummy1(), 2);
	// Should not fire if it is unbound
	m1.unbind();
	m1.set(5);
	TestModelListener('test not fire after unbind', dummy1(), 2);
	if (NumFailed === 0) {
		Title(NumTests + ' tests run...  All passed');
	} else {
		Title(NumTests + ' tests run, Failed: ' + NumFailed + '/' + NumTests);
	}
});