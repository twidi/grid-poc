/** @module Grid */

var JXON = require('../../vendors/JXON.js');
var _ = require('lodash');

/**
 * Manipulates grid data
 * @namespace
 *
 */
var Manipulator = {

    /**
     * Exceptions for the Manipulator module
     * @namespace
     *
     */
    Exceptions: {
        /**
         * Exception raised when a type is invalid
         * This is a subclass of "Error"
         * @class
         *
         * @param {string} [message] - The raised message
         *
         * @property {string} name - The name of the exception: "InvalidType"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        InvalidType: function(message) {
            this.name = 'InvalidType';
            this.message = message || 'Invalid type detected';
        },

        /**
         * Exception raised when an inconsistency occurs
         * This is a subclass of "Error"
         * @class
         *
         * @param {string} [message] - The raised message
         *
         * @property {string} name - The name of the exception: "Inconsistency"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        Inconsistency: function (message) {
            this.name = 'Inconsistency';
            this.message = message || 'Inconsistency detected';
        }
    },

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
     * @param {XML} [beforeRow] - The XML node of a row, on the given node, where to insert the new row before. If not given, the new row is added at the end. Cannot be used if the current type of the node is not "grid".
     *
     * @returns {XML} - The added row
     *
     * @throws {module:Grid~Manipulator.Exceptions.Inconsistency} If "beforeRow" is given but the node is not yet a grid
     * @throws {module:Grid~Manipulator.Exceptions.Inconsistency} If "beforeRow" is not in the content of the "node"
     */
    addRow: function(node, beforeRow) {
        // we insert the row in the content node
        var contentNode = node.querySelector(':scope > content');
        /* If this is not a grid node, create a first row this the actual
         * content in a cell */
        var nodeType = node.getAttribute('type');
        if (!this.reGrid.test(nodeType)) {
            // not compatible when we ask for inserting the new row before a new one
            if (beforeRow) {
                throw new this.Exceptions.Inconsistency("Cannot insert before a row if there is no row");
            }
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
        if (beforeRow && beforeRow.parentNode != contentNode) {
            throw new this.Exceptions.Inconsistency("The 'beforeRow' must be a child of the content of the 'node'");
        }
        var row = node.ownerDocument.createElement('rows');
        if (beforeRow) {
            contentNode.insertBefore(row, beforeRow);
        } else {
            contentNode.appendChild(row);
        }
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
     *
     * @throws {module:Grid~Manipulator.Exceptions.InvalidType} If the given "type" is not "grid" or "module"
     */
    addCell: function(row, type, contentNode) {
        if (!this.reType.test(type)) {
            throw new this.Exceptions.InvalidType("Cannot add cell of type <" + type + ">. Should be <grid> or <module>");
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
     *
     * @throws {module:Grid~Manipulator.Exceptions.InvalidType} If the type of the given node is not "grid"
     */
    cleanNode: function(node) {
        var nodeType = node.getAttribute('type');
        if (nodeType != 'grid') {
            throw new this.Exceptions.InvalidType("Cannot clean node of type <" + nodeType + ">. Should be <grid>");
        }

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

// Exceptions must be based on the Error class
_([
    Manipulator.Exceptions.InvalidType,
    Manipulator.Exceptions.Inconsistency,
]).forEach(function(exceptionClass) {
    exceptionClass.prototype = new Error();
    exceptionClass.prototype.constructor = exceptionClass;
});


window.Manipulator = Manipulator;
module.exports = Manipulator;