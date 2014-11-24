/** @module Grid */

var JXON = require('../../vendors/JXON.js');
var _ = require('lodash');

/**
 * Manipulates grid data
 *
 * @namespace
 */
var Manipulator = {

    // Nodes types that can directly accept rows
    reGrid: /^(mainGrid|grid)$/,

    // Allowed types of cell
    reType: /^(module|grid)$/,

    // RegExp to match XML nodes that will always be converted as array in JSON
    reXMLNodesAsArray: /^(rows|cells)$/,

    /**
     * Convert a Grid in JSON format to its XML representation
     *
     * @param {JSON} JSONGrid - The JSON Grid to represent in XML
     *
     * @returns {XML} - The XML representation of the JSON Grid
     */
    JSONGridToXML: function(JSONGrid) {
        return JXON.unbuild({grid: JSONGrid});
    },

    /**
     * Convert a Grid in XML format to its JSON representation
     *
     * @param {XML} XMLGrid - The XML Grid to represent in JSON
     *
     * @returns {JSON} - The JSON representation of the XML Grid
     */
    XMLGridToJSON: function(XMLGrid) {
        return JXON.build(
            XMLGrid.firstChild,
            2,  // verbosity set to 2 to convert empty nodes in {} instead of "true"
            null,
            null,
            this.reXMLNodesAsArray // regexp of nodes to always transform as arrays
        );
    },

    /**
     * Render a Grid in JSON format to its stringified XML representation
     *
     * @param {JSON} JSONGrid - The JSON Grid to represent in a stringified XML
     *
     * @returns {string} - The stringified XML representation of the JSON Grid
     */
    JSONGridToXMLString: function(JSONGrid) {
        var XMLGrid = this.JSONGridToXML(JSONGrid);
        return (new JXON.XMLSerializer()).serializeToString(XMLGrid);
    },

    /**
     * Convert a Grid in XML format to its stringified representation
     *
     * @param {XML} XMLGrid - The XML Grid to represent in in a stringified XML
     *
     * @returns {string} - The stringified XML representation of the XML Grid
     */
    XMLGridToXMLString: function(XMLGrid) {
        return (new JXON.XMLSerializer()).serializeToString(XMLGrid);
    },

    /**
     * Create a new XML grid from scratch
     *
     * @param  {string} name - The name of the new grid to create
     * @param  {integer} [space=5] - The space between modules in the new grid
     *
     * @returns {XML} - The XML version of the new created grid
     */
    createBaseGrid: function(name, space) {
        return this.JSONGridToXML({
            _name: name,
            _space: (space || 5) + 'px',
            _type: 'mainGrid',
            content: {}
        });
    },

    /**
     * Add a row to the given XML grid node. Update the node in place.
     * Will transform a non-grid node into a grid one, with a first row containing the actuel content
     *
     * @param {XML} node - The XML grid node on which to add a row (should contain a "type", which must be "mainGrid" or "grid")
     *
     * @returns {XML} - The added row
     */
    addRow: function(node) {
        // we insert the row in the content node
        var contentNode = node.querySelector(':scope > content');
        /* If this is not a grid node, create a first row this the actual
         * content in a cell */
        var nodeType = node.getAttribute('type');
        if (!this.reGrid.test(nodeType)) {
            // remove the node from its parent to move it into the future new cell
            node.removeChild(contentNode);
            // transform the current node into a grid one
            node.setAttribute('type', 'grid');
            var newContentNode = node.ownerDocument.createElement('content');
            node.appendChild(newContentNode);
            // add a row to hold the cell with old node data
            var cellRow = this.addRow(node);
            // add the cell to hold the old node data
            var cell = this.addCell(cellRow, nodeType, contentNode);
            // it's here we'll attach the row
            contentNode = newContentNode;
        };
        var row = node.ownerDocument.createElement('rows');
        contentNode.appendChild(row);
        return row;
    },



    /**
     * Add a cell to the given XML grid row. Update the row in place.
     *
     * @param {XML} row - The XML grid row on which to add a cell
     * @param {string} type - The type of cell to add: "grid" or "module"
     * @param {XML} [contentNode] - The XML "content" node to insert in the cell.
     * If not given, a new empty "content" node will be created.
     *
     * @returns {XML} - The added cell (XML), with the type and a content.
     */
    addCell: function(row, type, contentNode) {
        if (!this.reType.test(type)) {
            throw "Invalid type <" + type + ">. Should be 'grid' or 'module'";
        }
        var cell = row.ownerDocument.createElement('cells');
        cell.setAttribute('type', type);
        if (!contentNode) {
            contentNode = row.ownerDocument.createElement('content');
        }
        cell.appendChild(contentNode);
        row.appendChild(cell);
        return cell;
    },

    /**
     * Convert a XML grid node with only one row with only one cell, into a node
     * without rows (only the type and content are copied) but only the content of the cell
     *
     * @param  {XML} node - The JSON grid node to clean
     *
     * @returns {} - Returns nothing
     */
    cleanNode: function(node) {
        if (node.getAttribute('type') != 'grid') { return }

        var contentNode = node.querySelector(':scope > content');
        var rows = contentNode.querySelectorAll(':scope > rows');

        if (rows.length != 1) { return }

        var cells = rows[0].querySelectorAll(':scope > cells');

        if (!cells.length) {
            // in theory this should not happen (not having any cell)
            node.setAttribute('type', 'unknown');
            node.removeChild(contentNode);
            node.appendChild(node.ownerDocument.createElement('content'));
        } else if (cells.length == 1) {
            node.setAttribute('type', cells[0].getAttribute('type'));
            node.removeChild(contentNode);
            node.appendChild(cells[0].querySelector(':scope > content'));
        }
    }
};

window.Manipulator = Manipulator;
module.exports = Manipulator;