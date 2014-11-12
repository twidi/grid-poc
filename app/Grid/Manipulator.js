/** @module Grid */

var JXON = require('../libs/JXON');
var _ = require('lodash');

/** 
 * Manipulates grid data
 * @namespace
 */
var Manipulator = {

    reGrid: /^(mainGrid|grid)$/,
    reType: /^(module|grid)$/,

    /**
     * Convert a Grid in JSON format to its XML representation
     * @param {JSON} JSONGrid - The JSON Grid to represent in XML
     * @returns {XML} - The XML representation of the JSON Grid
     */
    JSONGridToXML: function(JSONGrid) {
        return JXON.unbuild({grid: JSONGrid});
    },

    /**
     * Convert a Grid in XML format to its JSON representation
     * @param {XML} XMLGrid - The XML Grid to represent in JSON
     * @returns {JSON} - The JSON representation of the XML Grid
     */
    XMLGridToJSON: function(XMLGrid) {
        return JXON.build(XMLGrid.firstChild);
    },

    /**
     * Render a Grid in JSON format to its stringified XML representation
     * @param {JSON} JSONGrid - The JSON Grid to represent in a stringified XML
     * @returns {string} - The stringified XML representation of the JSON Grid
     */
    JSONGridToXMLString: function(JSONGrid) {
        var XMLGrid = this.JSONGridToXML(JSONGrid);
        return (new JXON.XMLSerializer()).serializeToString(XMLGrid);
    },

    /**
     * Convert a Grid in XML format to its stringified representation
     * @param {XML} XMLGrid - The XML Grid to represent in in a stringified XML
     * @returns {string} - The stringified XML representation of the XML Grid
     */
    XMLGridToXMLString: function(XMLGrid) {
        return (new JXON.XMLSerializer()).serializeToString(XMLGrid);
    },

    /**
     * Create a new grid from scratch
     * @param  {string} name - The name of the new grid to create
     * @param  {integer} [space=5] - The space between modules in the new grid
     * @return {JSON} - The JSON version of the new created grid
     */
    createBaseGrid: function(name, space) {
        return {
            name: name,
            space: (space || 5) + 'px',
            type: 'mainGrid',
            content: {}
        };
    },

    /**
     * Add a row to the given JSON grid node. Update the node in place.
     * Will transform a non-grid node into a grid one, with a first row containing the actuel content
     * @param {object} node - The JSON grid node on which to add a row (should contain a "type")
     * @return {object} - The added row
     */
    addRow: function(node) {
        /* If this is not a grid node, create a first row this the actual
         * content in a cell */
        if (!this.reGrid.test(node.type)) {
            // keep node data to insert in cell later
            var cell_type = node.type;
            var cell_content = node.content;
            // transform the current node into a grid one
            node.type = 'grid';
            node.content = {};
            // add a row to hold the cell with old node data
            var cell_row = this.addRow(node);
            // add the cell to hold the old node data
            var cell = this.addCell(cell_row, cell_type);
            cell.content = cell_content;
        }
        if (_.isUndefined(node.content.rows)) {
            node.content.rows = [];
        }
        var row = {};
        node.content.rows.push(row);
        return row;
    },

    /**
     * Add a cell to the given JSON grid row. Update the row in place.
     * @param {object} row - The JSON grid row on which to add a cell
     * @param {string} type - The type of cell to add: 'grid' or 'module'
     * @return {object} - The added cell, with the type and an empty 'content' object
     */
    addCell: function(row, type) {
        if (!this.reType.test(type)) {
            throw "Invalid type <" + type + ">. Should be 'grid' or 'module'";
        }
        if (_.isUndefined(row.cells)) {
            row.cells = [];
        }
        var cell = {
            type: type,
            content: {}
        };
        row.cells.push(cell);
        return cell;
    },

    /**
     * Convert a JSON node with only one row with only one cell, into a node without rows (only the type and content are copied)
     * row but only the content of the cell
     * @param  {object} node - The JSON grid node to clean
     */
    cleanNode: function(node) {
        if (node.type == 'grid'
                && node.content.rows
                && node.content.rows.length == 1
                && (!node.content.rows[0].cells || node.content.rows[0].cells.length == 1)) {
            if (!node.content.rows[0].cells || node.content.rows[0].cells.length < 1) {
                // manage the case of a row with no cells
                node.type = 'unknown';
                node.content = {};
            } else {
                var cell = node.content.rows[0].cells.shift();
                node.type = cell.type;
                node.content = cell.content;
            }
        }
    }
};

module.exports = Manipulator;