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
    },

    /**
     * Create a new grid from scratch
     * @param  {string} name - The name of the new grid to create
     * @param  {integer} space - The space between modules in the new grid
     * @return {JSON} The JSON version of the new created grid
     */
    createBaseGrid: function(name, space) {
        return {
            name: name,
            space: space + 'px',
            rows: []
        };
    },

    /**
     * Add a row to the given grid node. Update the node in place.
     * @param {object} node - The JSON grid node on which to add a row
     * @return {object} The added row
     */
    addRow: function(node) {
        if (_.isUndefined(node.rows)) {
            node.rows = [];
        }
        var row = {};
        node.rows.push(row);
        return row;
    },

    /**
     * Add a cell to the given grid row. Update the row in place.
     * @param {object} row - The JSON grid row on which to add a cell
     * @param {string} type - The type of cell to add: 'grid' or 'module'
     * @return {object} The added cell, with the type and an empty 'content' object
     */
    addCell: function(row, type) {
        if (_.isUndefined(row.cells)) {
            row.cells = [];
        }
        var cell = {
            type: type,
            content: {}
        };
        row.cells.push(cell);
        return cell;
    }
};

module.exports = Manipulator;