var _ = require('lodash');

var Manipulator = require('./../../app/Grid/Manipulator');


/**
 * Jasmine custom matchers for the whole Grid test suite
 * @type {Object}
 */
var customMatchers = {
    /**
     * Easily compare two XML grids, given as string or XML nodes.
     * If no match, produce the error with actual and expected on both lines to
     * ease the search of the non matching parts (no real diff for now).
     *
     * @param  {string|XML} actual - The grid we want to check
     * @param  {string|XML} expected - The expected grid
     *
     * @example

     * var customMatchers = require('./custom-matchers');
     *
     * describe("Grid.Manipulator", function() {
     *
     *     beforeEach(function() {
     *         jasmine.addMatchers(customMatchers);
     *     });
     *
     *     it("should do something", function() {
     *
     *         // 4 way:
     *         expect(XMLGrid).toEqualXML(expectedXMLGrid)
     *         expect(stringifiedXMLGrid).toEqualXML(expectedXMLGrid)
     *         expect(XMLGrid).toEqualXML(stringifiedExpectedXMLGrid)
     *         expect(stringifiedXMLGrid).toEqualXML(stringifiedExpectedXMLGrid)
     *
     *         // most common use case:
     *         var grid = aFunctionThatReturnAXMLGrid();
     *         var expected = '<grid><foo/></grid';
     *         expect(grid).toEqualXML(expected);
     *
     *     });
     * });
     */
    toEqualXML: function(util, customEqualityTesters) {
        return {
            compare: function(actual, expected) {
                if (!_.isString(actual)) {
                    actual = Manipulator.XMLGridToXMLString(actual);
                }
                if (!_.isString(expected)) {
                    expected = Manipulator.XMLGridToXMLString(expected);
                }
                var result = {};
                result.pass = util.equals(actual, expected);
                if (result.pass) {
                    result.message = "XML is the one wanted";
                } else {
                    result.message = "XML is not the one wanted. Actual VS expected:\n" + actual + "\n" + expected;
                }
                return result;
            }
        };
    }
};

module.exports = customMatchers;
