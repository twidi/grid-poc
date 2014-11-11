/** @module Grid */

var JXON = require('../libs/JXON');
var _ = require('lodash');

/** 
 * Manipulates grid data
 * @namespace
 */
var Manipulator = {

    /**
     * Convert a Grid in JSON format to its XML representation
     * @param {JSON} JSONGrid - The JSON Grid to represent in XML
     * @returns {XML} The XML representation of the JSON Grid
     */
    JSONGridToXML: function(JSONGrid) {
        return JXON.unbuild({grid: JSONGrid});
    },

    /**
     * Convert a Grid in XML format to its JSON representation
     * @param {XML} XMLGrid - The XML Grid to represent in JSON
     * @returns {JSON} The JSON representation of the XML Grid
     */
    XMLGridToJSON: function(XMLGrid) {
        return JXON.build(XMLGrid.firstChild);
    },

    /**
     * Render a Grid in JSON format to its stringified XML representation
     * @param {JSON} JSONGrid - The JSON Grid to represent in a stringified XML
     * @returns {string} The stringified XML representation of the JSON Grid
     */
    JSONGridToXMLString: function(JSONGrid) {
        var XMLGrid = this.JSONGridToXML(JSONGrid);
        return (new JXON.XMLSerializer()).serializeToString(XMLGrid);
    },

    /**
     * Convert a Grid in XML format to its stringified representation
     * @param {XML} XMLGrid - The XML Grid to represent in in a stringified XML
     * @returns {string} The stringified XML representation of the XML Grid
     */
    XMLGridToXMLString: function(XMLGrid) {
        return (new JXON.XMLSerializer()).serializeToString(XMLGrid);
    }
};

module.exports = Manipulator;