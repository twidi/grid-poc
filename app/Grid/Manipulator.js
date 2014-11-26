/** @module Grid */

var JXON = require('../../vendors/JXON.js');
var _ = require('lodash');

/**
 * Manipulates grid data
 * @namespace
 *
 */
var Manipulator = {
    XMLSerializer: new XMLSerializer(),
    DOMParser: new DOMParser(),

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

    /**
     * Nodes types that can directly accept rows
     * @type {RegExp}
     */
    reGrid: /^(mainGrid|grid)$/,

    /**
     * Allowed types of cell
     * @type {RegExp}
     */
    reType: /^(module|grid|placeholder)$/,

    /**
     * RegExp to match XML nodes that will always be converted as array in JSON
     * @type {RegExp}
     * @private
     */
    _reXMLNodesAsArray: /^(rows|cells)$/,

    /**
     * Convert a Grid in JSON format to its XML representation
     *
     * @param {JSON} JSONGrid - The JSON Grid to represent in XML
     *
     * @returns {XML} - The XML representation of the JSON Grid
     */
    JSONGridToXML: function(JSONGrid) {
        return JXON.unbuild({grid: JSONGrid}).documentElement;
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
            XMLGrid,
            2,  // verbosity set to 2 to convert empty nodes in {} instead of "true"
            null,
            null,
            this._reXMLNodesAsArray // regexp of nodes to always transform as arrays
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
        return this.XMLGridToXMLString(this.JSONGridToXML(JSONGrid));
    },

    /**
     * Convert a Grid in XML format to its stringified representation
     *
     * @param {XML} XMLGrid - The XML Grid to represent in in a stringified XML
     *
     * @returns {string} - The stringified XML representation of the XML Grid
     */
    XMLGridToXMLString: function(XMLGrid) {
        return this.XMLSerializer.serializeToString(XMLGrid);
    },

    /**
     * Convert a string representation of an XML Grid to an XML document
     *
     * @param {string} XMLString - The string representation of the XML Grid to convert
     *
     * @returns {string} - The XML Grid based on the string representation
     */
    XMLStringToXMLGrid: function(XMLString) {
        return this.DOMParser.parseFromString(XMLString, "text/xml").documentElement;
    },

    /**
     * Return a deep clone of the given grid. Nothinf is shared between the clones.
     *
     * @param  {XML} grid - The grid to clone
     *
     * @return {XML} - The clone of the original grid
     */
    clone: function(grid) {
        return this.XMLStringToXMLGrid(this.XMLGridToXMLString(grid));
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
            var cell = this.addCell(cellRow, nodeType, null, contentNode);
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
     *     If not given, a new empty "content" node will be created.
     * @param {XML} [beforeCell] - The XML node of a cell, on the given row, where to insert the new cell before. If not given, the new cell is added at the end.
     *
     * @returns {XML} - The added cell (XML), with the type and a content.
     *
     * @throws {module:Grid~Manipulator.Exceptions.InvalidType} If the given "type" is not "grid" or "module"
     * @throws {module:Grid~Manipulator.Exceptions.Inconsistency} If "beforeCell" is not in the "row"
     */
    addCell: function(row, type, beforeCell, contentNode) {
        if (!this.reType.test(type)) {
            throw new this.Exceptions.InvalidType("Cannot add cell of type <" + type + ">. Should be <grid> or <module>");
        }
        var cell = row.ownerDocument.createElement('cells');
        cell.setAttribute('type', type);
        if (!contentNode) {
            contentNode = row.ownerDocument.createElement('content');
        }
        if (beforeCell && beforeCell.parentNode != row) {
            throw new this.Exceptions.Inconsistency("The 'beforeCell' must be a child of 'row'");
        }
        cell.appendChild(contentNode);
        if (beforeCell) {
            row.insertBefore(cell, beforeCell);
        } else {
            row.appendChild(cell);
        }
        return cell;
    },

    /**
     * Clean a grid node by doing two operations:
     * 1/ Remove all empty cells/rows/contents
     * 2/ if a XML grid node has only one row with only one cell, convert the grid node into a node
     * without rows (only the type and content are copied) but only the content of the cell
     * 3/ if a XML grid node has only one row, with only one cell of type "grid", move all rows from
     * this cell into the current grid
     * All this is done recursively by calling the same method for the parent grid
     *
     * @param  {XML} grid - The JSON grid node to clean
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid~Manipulator.Exceptions.InvalidType} If the grid is not a grid (type nor "grid" nor "mainGrid")
     */
    cleanGrid: function(grid) {
        nodeType = grid.getAttribute('type');
        if (!this.reGrid.test(nodeType)) {
            throw new this.Exceptions.InvalidType("Cannot clean node of type <" + nodeType + ">. Should be <grid> or <mainGrid>");
        }

        var contentNode = grid.querySelector(':scope > content');

        // remove all empty things, until there is no more
        var somethingRemoved = true;
        while (somethingRemoved) {
            somethingRemoved = false;

            // remove all empty cells (assume only possible children is "content")
            _(contentNode.querySelectorAll('cells:empty')).forEach(function(cell) {
                cell.parentNode.removeChild(cell);
                somethingRemoved = true;
            });

            // remove all empty rows (assume only possible children are "cells")
            _(contentNode.querySelectorAll('rows:empty')).forEach(function(row) {
                row.parentNode.removeChild(row);
                somethingRemoved = true;
            });

            // remove all grid withtout rows
            _(contentNode.querySelectorAll('cells[type=grid] > content:empty')).forEach(function(content) {
                content.parentNode.removeChild(content);
                somethingRemoved = true;
            });
        }

        // reload contentNode if emptyed below
        contentNode = grid.querySelector(':scope > content');
        var rows = contentNode.querySelectorAll(':scope > rows');

        if (rows.length == 1) {
            var cells;

            // move a grid inside the current grid only if it's a subgrid
            if (nodeType == 'grid') {
                cells = rows[0].querySelectorAll(':scope > cells');
                if (cells.length == 1) {
                    grid.setAttribute('type', cells[0].getAttribute('type'));
                    grid.removeChild(contentNode);
                    grid.appendChild(cells[0].querySelector(':scope > content'));
                }
                rows = null;
                cells = null;
            }

            // we have only one row, but with it only one grid cell, ce move all replace our row by the cell ones
            if (!rows) {
                rows = contentNode.querySelectorAll(':scope > rows');
            }
            if (rows.length == 1) {
                if (!cells) {
                    cells = rows[0].querySelectorAll(':scope > cells');
                }
                if (cells.length == 1 && cells[0].getAttribute('type') == 'grid') {
                    var contentNode = grid.querySelector(':scope > content');
                    // add all sub rows to the current grid
                    _(cells[0].querySelectorAll(':scope > content > rows')).forEach(function(cellRow) {
                        contentNode.appendChild(cellRow);
                    });
                    // our original row is now empty, we can remove it
                    contentNode.removeChild(rows[0]);
                }
            }

        }

        // Continue for the parent grid (parent is the row, parent.parent is the content, parent.parent.parent is the grid)
        try {
            this.cleanGrid(grid.parentNode.parentNode.parentNode);
        } catch (e) {
            if (e instanceof TypeError || e instanceof this.Exceptions.InvalidType) {
                // We siliently ignore these exceptions. This can happen for many reasons:
                // - a parentNode is null => TypeError
                // - the final parentNode has no "getAttribute" (the xml root document) => TypeError
                // - the final parentNode is not a "grid" => InvalidType
            } else {
                // other cases, throw the original exception
                throw(e);
            }
        }
    },


    /**
     * Add all placeholders in the given grid
     *
     * @param {XML} grid - The grid to insert placeholders in
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid~Manipulator.Exceptions.InvalidType} If the grid is not a main grid (type "mainGrid")
     */
    addPlaceholders: function(grid) {
        nodeType = grid.getAttribute('type');
        if (nodeType != 'mainGrid') {
            throw new this.Exceptions.InvalidType("Cannot add placeholders in grid of type <" + nodeType + ">. Should be <mainGrid>");
        }
        this._addRowsPlaceholders(grid);
    },

    /**
     * Add rows placeholders around each row in the given grid
     * (each row will have an empty placeholder cell)
     *
     * @param {XML} grid - The grid to insert placeholders in
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid~Manipulator.Exceptions.InvalidType} If the grid is not a grid (type nor "grid" nor "mainGrid")
     *
     * @private
     */
    _addRowsPlaceholders: function(grid) {
        nodeType = grid.getAttribute('type');
        if (!this.reGrid.test(nodeType)) {
            throw new this.Exceptions.InvalidType("Cannot add rows placeholders in node of type <" + nodeType + ">. Should be <grid> or <mainGrid>");
        }

        var contentNode = grid.querySelector(':scope > content');
        // add a row before each one in the list
        _(contentNode.querySelectorAll(':scope > rows')).forEach(function(row) {
            var placeholder = Manipulator.addRow(grid, row);
            placeholder.setAttribute('type', 'placeholder');
            Manipulator._addCellsPlaceholders(row);
            Manipulator._addCellsPlaceholders(placeholder);
        });
        // and one at the end
        var placeholder = Manipulator.addRow(grid);
        placeholder.setAttribute('type', 'placeholder');
        Manipulator._addCellsPlaceholders(placeholder);
    },

    /**
     * Add cells placeholders around each cell in the given row
     * Each existing "grid" cell will also be populated with row placeholders
     *
     * @param {XML} row - The row to insert placeholders in
     *
     * @returns {} - Returns nothing
     *
    * @private
     */
    _addCellsPlaceholders: function(row) {
        // add a cell before each one in the list
        _(row.querySelectorAll(':scope > cells')).forEach(function(cell) {
            Manipulator.addCell(row, 'placeholder', cell);
            if (cell.getAttribute('type') == 'grid') {
                Manipulator._addRowsPlaceholders(cell);
            }
        });
        // and one at the end
        Manipulator.addCell(row, 'placeholder');
    },

    /**
     * Remove all existing placeholders, except ones with a module
     *
     * @param  {XML} grid The grid in whitch to remove the placeholders
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid~Manipulator.Exceptions.InvalidType} If the grid is not a main grid (type "mainGrid")
     */
    removePlaceholders: function(grid) {
        nodeType = grid.getAttribute('type');
        if (nodeType != 'mainGrid') {
            throw new this.Exceptions.InvalidType("Cannot remove placeholders in grid of type <" + nodeType + ">. Should be <mainGrid>");
        }

        // remove each placeholders rows except ones with a module in
        _(grid.querySelectorAll('rows[type=placeholder]')).forEach(function(row) {
            if (row.querySelectorAll('cells[type=module]').length) { return; }
            row.parentNode.removeChild(row);
        });
        // remove each placeholders cells except ones with a module in
        _(grid.querySelectorAll('cells[type=placeholder]')).forEach(function(cell) {
            if (cell.querySelectorAll('cells[type=module]').length) { return; }
            cell.parentNode.removeChild(cell);
        });
        // remove type=placeholder attribute for trees with a module (ie, all nodes left having type=placeholder)
        _(grid.querySelectorAll('[type=placeholder]')).forEach(function(node) {
            node.removeAttribute('type');
        });
    }

};

// Exceptions must be based on the Error class
_(Manipulator.Exceptions).forEach(function(exceptionClass) {
    exceptionClass.prototype = new Error();
    exceptionClass.prototype.constructor = exceptionClass;
});

window.Manipulator = Manipulator;
module.exports = Manipulator;