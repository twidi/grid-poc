import _ from 'lodash';

import { Exceptions } from '../Utils/Exceptions';


/**
 * Manipulates grid data
 * @namespace
 * @memberOf module:Grid
 */
const Manipulator = {
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
         * @param {string} [message=Invalid type detected] - The raised message
         *
         * @property {string} name - The name of the exception: "InvalidType"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        InvalidType: function InvalidType(message) {
            this.name = 'InvalidType';
            this.message = message || 'Invalid type detected';
        },

        /**
         * Exception raised when an inconsistency occurs
         * This is a subclass of "Error"
         * @class
         *
         * @param {string} [message=Inconsistency detected] - The raised message
         *
         * @property {string} name - The name of the exception: "Inconsistency"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        Inconsistency: function Inconsistency(message) {
            this.name = 'Inconsistency';
            this.message = message || 'Inconsistency detected';
        },

        /**
         * Exception raised when a the state of something is not the one expected
         * This is a subclass of "Error"
         * @class
         *
         * @param {string} [message=Invalid state detected] - The raised message
         *
         * @property {string} name - The name of the exception: "InvalidState"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        InvalidState: function InvalidState(message) {
            this.name = 'InvalidState';
            this.message = message || 'Invalid state detected';
        }
    },

    /**
     * Nodes types that can directly accept rows
     * @type {RegExp}
     */
    reGridType: /^(mainGrid|grid)$/,

    /**
     * Allowed types of cell
     * @type {RegExp}
     */
    reCellType: /^(module|grid|placeholder)$/,


    /**
     * Allowed types of resizers
     * @type {RegExp}
     */
    reResizerType: /^(vertic|horizont)al$/,

    /**
     * Convert a Grid in XML format to its stringified representation
     *
     * @param {XML} XMLGrid - The XML Grid to represent in in a stringified XML
     *
     * @returns {string} - The stringified XML representation of the XML Grid
     */
    XMLGridToXMLString(XMLGrid) {
        return this.XMLSerializer.serializeToString(XMLGrid);
    },

    /**
     * Convert a string representation of an XML Grid to an XML document
     *
     * @param {string} XMLString - The string representation of the XML Grid to convert
     *
     * @returns {string} - The XML Grid based on the string representation
     */
    XMLStringToXMLGrid(XMLString) {
        return this.DOMParser.parseFromString(XMLString, 'text/xml').documentElement;
    },

    /**
     * Return a deep clone of the given grid. Nothing is shared between the clones.
     *
     * @param  {XML} grid - The grid to clone
     *
     * @return {XML} - The clone of the original grid
     */
    clone(grid) {
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
    createBaseGrid(name, space) {
        const grid = this.XMLStringToXMLGrid('<grid><content/></grid>');
        grid.setAttribute('name', name);
        grid.setAttribute('space', (space || 5) + 'px');
        grid.setAttribute('type', 'mainGrid');
        return grid;
    },

    /**
     * Surround a cell, of any type, by a grid which will have one row, and
     * inside this row, a cell with the content of the original cell.
     *
     * The given cell is transformed in a one of type "grid", and its content
     * will be moved in the inside cell
     *
     * @param  {XML} cell The cell we want to convert
     *
     * @return {XML} - The inner cell
     */
    surroundCellWithGrid(cell) {
        const type = cell.getAttribute('type');

        // new types of both cells (existing, and new one inside)
        const mainCellType = type == 'module' ? 'grid' : type;
        const innerCellType = type == 'module' ? 'module' : 'grid';

        const contentNode = cell.querySelector(':scope > content');

        // remove the cell content from the cell to move it into the future new cell
        cell.removeChild(contentNode);
        // transform the current cell into a grid one
        cell.setAttribute('type', mainCellType);
        const newContentNode = cell.ownerDocument.createElement('content');
        cell.appendChild(newContentNode);
        // add a row to hold the old cell content
        const cellRow = this.addRow(cell);
        // add the cell to hold the old cell content
        return this.addCell(cellRow, null, innerCellType, contentNode);
    },

    /**
     * Add a row to the given XML grid node. Update the node in place.
     * Will transform a non-grid node into a grid one, with a first row containing the actuel content
     *
     * @param {XML} node - The XML grid node on which to add a row (should contain a "type", which must be "mainGrid" or "grid")
     * @param {XML} [beforeRow=null] - The XML node of a row, on the given node, where to insert the new row before. If not given, the new row is added at the end. Cannot be used if the current type of the node is not "grid".
     * @param {string} [type=null] - If defined, the value of the "type" attribute to set on the row
     *
     * @returns {XML} - The added row
     *
     * @throws {module:Grid.Manipulator.Exceptions.Inconsistency} If "beforeRow" is given but the node is not yet a grid
     * @throws {module:Grid.Manipulator.Exceptions.Inconsistency} If "beforeRow" is not in the content of the "node"
     */
    addRow(node, beforeRow, type) {
        /* If this is not a grid node, create a first row this the actual
         * content in a cell */
        if (!this.reGridType.test(node.getAttribute('type'))) {
            // not compatible when we ask for inserting the new row before a new one
            if (beforeRow) {
                throw new this.Exceptions.Inconsistency('Cannot insert before a row if there is no row');
            }
            this.surroundCellWithGrid(node);
        }

        // we insert the row in the content node
        const contentNode = node.querySelector(':scope > content');

        if (beforeRow && beforeRow.parentNode != contentNode) {
            throw new this.Exceptions.Inconsistency('The \'beforeRow\' must be a child of the content of the \'node\'');
        }
        const row = node.ownerDocument.createElement('row');
        if (beforeRow) {
            contentNode.insertBefore(row, beforeRow);
        } else {
            contentNode.appendChild(row);
        }

        if (type) {
            row.setAttribute('type', type);
        }
        return row;
    },


    /**
     * Add a cell to the given XML grid row. Update the row in place.
     *
     * @param {XML} row - The XML grid row on which to add a cell
     * @param {XML} [beforeCell=null] - The XML node of a cell, on the given row, where to insert the new cell before. If not given, the new cell is added at the end.
     * @param {string} type - The type of cell to add: "grid" or "module"
     * @param {XML} [contentNode=null] - The XML "content" node to insert in the cell.
     *     If not given, a new empty "content" node will be created.
     *
     * @returns {XML} - The added cell (XML), with the type and a content.
     *
     * @throws {module:Grid.Manipulator.Exceptions.InvalidType} If the given "type" is not "grid" or "module"
     * @throws {module:Grid.Manipulator.Exceptions.Inconsistency} If "beforeCell" is not in the "row"
     */
    addCell(row, beforeCell, type, contentNode) {
        if (!this.reCellType.test(type)) {
            throw new this.Exceptions.InvalidType('Cannot add cell of type <' + type + '>. Should be <grid> or <module>');
        }
        const cell = row.ownerDocument.createElement('cell');
        cell.setAttribute('type', type);
        if (!contentNode) {
            contentNode = row.ownerDocument.createElement('content');
        }
        if (beforeCell && beforeCell.parentNode != row) {
            throw new this.Exceptions.Inconsistency('The \'beforeCell\' must be a child of \'row\'');
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
     * Remove the given cell from the grid it belongs to
     *
     * @param  {XML} cell - The XML cell to remove
     */
    removeCell(cell) {
        const parentGrid = this.getNearestGrid(cell);
        cell.parentNode.removeChild(cell);
        this.cleanGrid(parentGrid);
    },

    /**
     * Create a content node, to be later inserted into an empty module cell, with the given attributes
     *
     * @param  {XML} grid - The grid on which the content node is aimed to be attached
     * @param  {Object} attributes - All attributes to include in the content node. Note that all attributes
     *                               will be inserted as text
     *
     * @return {XML} - The newly created <content> xml node
     */
    createContentNode(grid, attributes) {
        const contentNode = grid.ownerDocument.createElement('content');
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                contentNode.setAttribute(key, attributes[key]);
            }
        }
        return contentNode;
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
     * @param  {XML} grid - The XML grid node to clean
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid.Manipulator.Exceptions.InvalidType} If the grid is not a grid (type nor "grid" nor "mainGrid")
     */
    cleanGrid(grid) {
        let nodeType = grid.getAttribute('type');
        if (!this.reGridType.test(nodeType)) {
            throw new this.Exceptions.InvalidType('Cannot clean node of type <' + nodeType + '>. Should be <grid> or <mainGrid>');
        }

        // get the next parent grid to compute (we may not be able to do it this way later)
        let parentGrid;
        try {
            parentGrid = grid.parentNode.parentNode.parentNode;
        } catch (e) {
            if (e instanceof TypeError) {
                // We silently ignore these exceptions. This can happen for many reasons:
                // - a parentNode is null => TypeError
                // - the final parentNode has no "getAttribute" (the xml root document) => TypeError
            } else {
                // other cases, throw the original exception
                throw (e);
            }
        }

        let contentNode = grid.querySelector(':scope > content');

        if (contentNode) {

            // remove all empty things, until there is no more
            let somethingRemoved = true;
            while (somethingRemoved) {
                somethingRemoved = false;

                // remove all empty cells (assume only possible children is "content")
                _(contentNode.querySelectorAll('cell:empty')).forEach(cell => {
                    cell.parentNode.removeChild(cell);
                    somethingRemoved = true;
                });

                // remove all empty rows (assume only possible children are "cells")
                _(contentNode.querySelectorAll('row:empty')).forEach(row => {
                    row.parentNode.removeChild(row);
                    somethingRemoved = true;
                });

                // remove all grid withtout rows
                _(contentNode.querySelectorAll('cell[type=grid] > content:empty')).forEach(content => {
                    content.parentNode.removeChild(content);
                    somethingRemoved = true;
                });

                // remove rows having only placeholders cells (and more than one: the other ones used to
                // hold real cells not here anymore)
                _(contentNode.querySelectorAll('row:not([type=placeholder])')).forEach(row => {
                    const nbPlaceholderCells = row.querySelectorAll(':scope > cell[type=placeholder]').length;
                    if (nbPlaceholderCells > 1) {
                        const nbCells = row.querySelectorAll(':scope > cell').length;
                        if (nbCells == nbPlaceholderCells) {
                            row.parentNode.removeChild(row);
                        }
                    }
                });

            }

            // reload contentNode if emptyed above
            contentNode = grid.querySelector(':scope > content');
            let rows = contentNode.querySelectorAll(':scope > row');

            if (rows.length == 1) {
                let cells;

                // move a grid inside the current grid only if it's a subgrid
                if (nodeType == 'grid') {
                    cells = rows[0].querySelectorAll(':scope > cell');
                    if (cells.length == 1) {
                        nodeType = cells[0].getAttribute('type');
                        grid.setAttribute('type', nodeType);
                        grid.removeChild(contentNode);
                        grid.appendChild(cells[0].querySelector(':scope > content'));
                        contentNode = null;
                    }
                    rows = null;
                    cells = null;
                }

                if (!contentNode) {
                    contentNode = grid.querySelector(':scope > content');
                }

                // we have only one row, but within it only one grid cell, so we replace our row by the cell ones
                if (!rows) {
                    rows = contentNode.querySelectorAll(':scope > row');
                }
                if (rows.length == 1) {
                    if (!cells) {
                        cells = rows[0].querySelectorAll(':scope > cell');
                    }
                    if (cells.length == 1 && cells[0].getAttribute('type') == 'grid') {
                        // add all sub rows to the current grid
                        _(cells[0].querySelectorAll(':scope > content > row')).forEach(cellRow => contentNode.appendChild(cellRow));
                        // our original row is now empty, we can remove it
                        contentNode.removeChild(rows[0]);
                    } else if (this.reGridType.test(nodeType)) {  // maybe it's a module now
                        // only one row but many cells... maybe we are the only child of our parent row ?
                        const parentRow = grid.parentNode;
                        if (parentRow && parentRow.querySelectorAll(':scope > cell').length == 1) {
                            // ok so we move our cells in our parent row
                            _(cells).forEach(cell => parentRow.appendChild(cell));
                            parentRow.removeChild(grid);
                            parentGrid = parentRow.parentNode.parentNode;
                        }
                    }
                }

            }

        }

        // Continue for the parent grid (parent is the row, parent.parent is the content, parent.parent.parent is the grid)
        try {
            if (parentGrid) { this.cleanGrid(parentGrid); }
        } catch (e) {
            if (e instanceof TypeError || e instanceof this.Exceptions.InvalidType) {
                // We silently ignore these exceptions. This can happen for many reasons:
                // - the final parentNode is not a "grid" => InvalidType
            } else {
                // other cases, throw the original exception
                throw (e);
            }
        }
    },

    /**
     * Tel if the grid has placeholders
     *
     * @param {XML} grid - The grid to test
     *
     * @return {Boolean} - true if the grid has placeholders
     */
    hasPlaceholders(grid) {
        return !!grid.getAttribute('hasPlaceholders');
    },

    /**
     * Add all placeholders in the given grid
     * Add a "hasPlaceholders" attribute (set to "true") on the main grid node.
     *
     * @param {XML} grid - The grid to insert placeholders in
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid.Manipulator.Exceptions.InvalidType} If the grid is not a main grid (type "mainGrid")
     * @throws {module:Grid.Manipulator.Exceptions.InvalidState} If the grid already has placeholders or resizers
     */
    addPlaceholders(grid) {
        const nodeType = grid.getAttribute('type');
        if (nodeType != 'mainGrid') {
            throw new this.Exceptions.InvalidType('Cannot add placeholders in grid of type <' + nodeType + '>. Should be <mainGrid>');
        }
        if (this.hasPlaceholders(grid)) {
            throw new this.Exceptions.InvalidState('Cannot add placeholders on a grid which already have them');
        }
        if (this.hasResizers(grid)) {
            throw new this.Exceptions.InvalidState('Cannot add resizers on a grid which already have placeholders');
        }

        let placeholder, row, cells, grids, subGrid, isSurround, displayLeftRightPlaceholders;

        // surround all grid, including current if it matches
        grids = grid.parentNode.querySelectorAll('grid, cell[type=grid]');
        for (let i = 0; i < grids.length; i++) {
            subGrid = grids[i];

            // surround the grid if it has more than one row
            if (subGrid.querySelectorAll(':scope > content > row').length > 1) {
                this.surroundCellWithGrid(subGrid);
                subGrid.setAttribute('surround', 1);
            }
        }

        // surround all modules if more than one in the grid
        const modules = grid.querySelectorAll('cell[type=module]');
        if (modules.length > 1) {
            for (let j = 0; j < modules.length; j++) {
                this.surroundCellWithGrid(modules[j]);
                modules[j].setAttribute('surround', 1);
            }
        }

        // add cells placeholders on each row
        let rows = grid.querySelectorAll('row');
        for (let m = 0; m < rows.length; m++) {
            row = rows[m];
            cells = row.querySelectorAll(':scope > cell');

            // is the row on a grid here only to surround an other one ?
            isSurround = row.parentNode.parentNode.hasAttribute('surround');

            // if only one cell, which is a grid, and only one module inside, no need to add
            // left/rights placeholders because ones around the module will do the job
            displayLeftRightPlaceholders = !(cells.length == 1
                                          && cells[0].getAttribute('type') == 'grid'
                                          && row.querySelectorAll('cell[type=module]').length == 1);

            // add a cell placeholders before each cell
            for (let n = 0; n < cells.length; n++) {
                // if it's the first cell and we don't want one on the left/right, do nothing
                if (n > 0 || displayLeftRightPlaceholders) {
                    const cell = cells[n];
                    placeholder = Manipulator.addCell(row, cell, 'placeholder');
                    if (isSurround) { placeholder.setAttribute('surround', 1); }
                }
            }
            // add a cell placeholder after the last cell, except if we don't want one on the left/right
            if (displayLeftRightPlaceholders) {
                placeholder = Manipulator.addCell(row, null, 'placeholder');
                if (isSurround) { placeholder.setAttribute('surround', 1); }
            }
        }

        // add row placeholders on each grid
        grids = grid.parentNode.querySelectorAll('grid, cell[type=grid]');
        for (let k = 0; k < grids.length; k++) {
            const subGrid = grids[k];
            rows = subGrid.querySelectorAll(':scope > content > row');

            // is the cell on a grid here only to surround an other one ?
            isSurround = subGrid.hasAttribute('surround');

            // add a row placeholder before each row
            for (let l = 0; l < rows.length; l++) {
                const row = rows[l];
                placeholder = Manipulator.addCell(
                    Manipulator.addRow(subGrid, row, 'placeholder')
                    , null, 'placeholder'
                );
                if (isSurround) { placeholder.setAttribute('surround', 1); }
            }

            // add a row placeholder after the last row
            placeholder = Manipulator.addCell(
                Manipulator.addRow(subGrid, null, 'placeholder')
                , null, 'placeholder'
            );
            if (isSurround) { placeholder.setAttribute('surround', 1); }
        }

        // finally mark the grid
        grid.setAttribute('hasPlaceholders', true);
    },

    /**
     * Remove all existing placeholders, except ones with a module.
     * Remove the "hasPlaceholders" attribute on the main grid node.
     *
     * @param  {XML} grid The grid in witch to remove the placeholders
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid.Manipulator.Exceptions.InvalidType} If the grid is not a main grid (type "mainGrid")
     * @throws {module:Grid.Manipulator.Exceptions.InvalidState} If the grid isn't marked as having placeholders
     */
    removePlaceholders(grid) {
        const nodeType = grid.getAttribute('type');
        if (nodeType != 'mainGrid') {
            throw new this.Exceptions.InvalidType('Cannot remove placeholders in grid of type <' + nodeType + '>. Should be <mainGrid>');
        }
        if (!this.hasPlaceholders(grid)) {
            throw new this.Exceptions.InvalidState('Cannot remove placeholders on a grid which doesn\'t have any');
        }

        // remove each placeholders rows except ones with a module in
        _(grid.querySelectorAll('row[type=placeholder]')).forEach(row => {
            if (row.querySelectorAll('cell[type=module]').length) { return; }
            row.parentNode.removeChild(row);
        });
        // remove each placeholders cells except ones with a module in
        _(grid.querySelectorAll('cell[type=placeholder]')).forEach(cell => {
            if (cell.querySelectorAll('cell[type=module]').length) { return; }
            cell.parentNode.removeChild(cell);
        });
        // remove type=placeholder attribute for trees with a module (ie, all nodes left having type=placeholder)
        _(grid.querySelectorAll('[type=placeholder]')).forEach(node => node.removeAttribute('type'));

        // clean all module cells
        _(grid.querySelectorAll('cell[type=grid]')).forEach(cell => Manipulator.cleanGrid(cell));

        // remove all 'surround' attributes
        _(grid.querySelectorAll('[surround]')).forEach(cell => cell.removeAttribute('surround'));
        grid.removeAttribute('surround');

        grid.removeAttribute('hasPlaceholders');
    },

    /**
     * Clean existing placeholders to be in a valid state. Usefull to call after adding/removing a module
     *
     * @param  {XML} grid The grid for witch to clean the placeholders
     *
     * @returns {} - Returns nothing
     */
    cleanPlaceholders(grid) {
        this.removePlaceholders(grid);
        this.addPlaceholders(grid);
    },

    /**
     * Return the nearest grid (or mainGrid) for the given node
     *
     * @param  {XML} node - The grid node (can be a row, cell, content...) for which we want the grid
     * @param {boolean} includeCurrent - If we test the given node if it's a grid and return it if True
     *
     * @return {XML} - The found grid node, or null if none found (may not happen)
     */
    getNearestGrid(node, includeCurrent) {
        if (!includeCurrent) {
            node = node.parentNode;
        }
        while (true) {
            // no node to test (given node or an absent parent), stop here
            if (!node) {
                return null;
            }
            // check if type is grid/mainGrid
            const nodeType = node.getAttribute ? node.getAttribute('type') : null;
            if (nodeType && this.reGridType.test(nodeType)) {
                return node;
            }
            // continue with the parentNode
            node = node.parentNode;
        }
    },

    /**
     * Tell if the given node contains a subgrid.
     *
     * @param  {XML} node - The XML node to check for sub grids
     *
     * @return {Boolean} - `true` if the node contains at least one subgrid, or `false`
     */
    containsSubGrid(node) {
        return !!node.querySelector('cell[type=grid]');
    },

    /**
     * Remove a content node from its grid
     *
     * @param  {XML} contentNode - The "content" node we want to remove
     * @param {boolean} [dontClean=false] - Do not try to clean the parent grid node
     */
    removeContentNode(contentNode, dontClean) {
        // save actual grid parent to "clean" it after the move
        const gridNode = dontClean ? null : this.getNearestGrid(contentNode);

        // remove the node from the grid
        if (contentNode.parentNode) {
            contentNode.parentNode.removeChild(contentNode);
        }

        // now clean the old parent that may be empty now
        if (gridNode) {
            this.cleanGrid(gridNode);
        }
    },

    /**
     * Move a content node (module) to a placeholder
     *
     * @param  {XML} contentNode - The content node to move
     * @param  {XML} placeholderCell - The cell placeholder in which to move the content
     *
     * @return {} - Reurns nothing
     *
     * @throws {module:Grid.Manipulator.Exceptions.InvalidType} If the placeholder cell is not a placeholder (type "placeholder")
     */
    moveContentToPlaceholder(contentNode, placeholderCell) {
        const placeholderType = placeholderCell.getAttribute('type');
        if (placeholderType != 'placeholder') {
            throw new this.Exceptions.InvalidType('Cannot move content in cell of type <' + placeholderType + '>. It must be <placeholder>');
        }

        // remove the existing placeholder content
        const placeholderContent = placeholderCell.querySelector(':scope > content');
        if (placeholderContent) {
            placeholderCell.removeChild(placeholderContent);
        }

        // save actual content parent to "clean" it after the move
        const contentParentNode = this.getNearestGrid(contentNode);

        // actually move the content in the placeholder
        placeholderCell.appendChild(contentNode);
        placeholderCell.setAttribute('type', 'module');

        // clean the old parent node if any
        if (contentParentNode) {
            this.cleanGrid(contentParentNode);
        }

    },

    /**
     * Create the "content" XML node to use as a module (in a <cell type=module>)
     *
     * @param  {JSON} params - The params of the module, to be converted in XML.
     * It should be a single level object with only string or numbers.
     * There is no validation for now but only these keys are guaranteed to be restored as is.
     *
     * @return {XML} - The XML content node
     */
    createModuleNode(params) {
        const node = this.XMLStringToXMLGrid('<content/>');
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                node.setAttribute(key, params[key]);
            }
        }
        return node;
    },

    /**
     * Set an unique ID on the given node and each of if sub nodes (whole tree)
     * Don't update nodes that already have an ID
     *
     * @returns {} - Returns nothing
     */
    setIds(node) {
        const nodes = _.toArray(node.querySelectorAll('*:not([id])'));
        if (!node.getAttribute('id')) {
            nodes.unshift(node);
        }
        _(nodes).forEach(subnode => subnode.setAttribute('id', _.uniqueId(subnode.tagName + '-')));
    },


    /**
     * Tel if the grid has resizers
     *
     * @param {XML} grid - The grid to test
     *
     * @return {Boolean} - true if the grid has resizers
     */
    hasResizers(grid) {
        return !!grid.getAttribute('hasResizers');
    },

    /**
     * Add all resizers in the given grid
     * Add a "hasResizers" attribute (set to "true") on the main grid node.
     *
     * @param {XML} grid - The grid to insert resizers in
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid.Manipulator.Exceptions.InvalidType} If the grid is not a main grid (type "mainGrid")
     * @throws {module:Grid.Manipulator.Exceptions.InvalidState} If the grid already has resizers or placeholders
     */
    addResizers(grid) {
        const nodeType = grid.getAttribute('type');
        if (nodeType != 'mainGrid') {
            throw new this.Exceptions.InvalidType('Cannot add resizers in grid of type <' + nodeType + '>. Should be <mainGrid>');
        }
        if (this.hasResizers(grid)) {
            throw new this.Exceptions.InvalidState('Cannot add resizers on a grid which already have them');
        }
        if (this.hasPlaceholders(grid)) {
            throw new this.Exceptions.InvalidState('Cannot add resizers on a grid which already have placeholders');
        }

        let rows, cells;

        // add a resizer between each row of a grid
        const grids = grid.parentNode.querySelectorAll('grid, cell[type=grid]');
        for (let i = 0; i < grids.length; i++) {
            // add a horizontal resizer before each row, except before the first one
            rows = grids[i].querySelectorAll(':scope > content > row');
            for (let j = 0; j < rows.length; j++) {
                if (j) { Manipulator.addResizer(rows[j]); }
                // add a vertical resizer before each row, except before the first one
                cells = rows[j].querySelectorAll(':scope > cell');
                for (let k = 1; k < cells.length; k++) {
                    Manipulator.addResizer(cells[k]);
                }
            }
        }

        // finally mark the grid
        grid.setAttribute('hasResizers', true);
    },

    /**
     * Add a resizer before the given XML grid row or cell
     *
     * @param {XML} beforeNode - The node (row or cell) of the grid before which to add the resizer
     * @param {string} type - The type of placeholder to add: "vertical" or "horizontal"
     *
     * @returns {XML} - The added resizer (XML), with the type.
     *
     * @throws {module:Grid.Manipulator.Exceptions.InvalidType} If the given node is not a row neither a cell
     * @throws {module:Grid.Manipulator.Exceptions.Inconsistency} If the given node is the first child
     */
    addResizer(beforeNode) {
        const nodeType = beforeNode.tagName;
        let resizerType;
        if (nodeType == 'row') {
            resizerType = 'horizontal';
        } else if (nodeType == 'cell') {
            resizerType = 'vertical';
        } else {
            throw new this.Exceptions.InvalidType('Cannot add a resizer before a node of type <' + nodeType + '>. Should be a <rows> or a <cell>');
        }
        if (beforeNode == beforeNode.parentNode.firstChild) {
            throw new this.Exceptions.Inconsistency('Cannot add a resizer before the first node');
        }
        const resizer = beforeNode.ownerDocument.createElement('resizer');
        resizer.setAttribute('type', resizerType);
        beforeNode.parentNode.insertBefore(resizer, beforeNode);
        return resizer;
    },
    /**
     * Remove all existing resizers
     * Remove the "hasResizers" attribute on the main grid node.
     *
     * @param  {XML} grid The grid in witch to remove the resizers
     *
     * @returns {} - Returns nothing
     *
     * @throws {module:Grid.Manipulator.Exceptions.InvalidType} If the grid is not a main grid (type "mainGrid")
     * @throws {module:Grid.Manipulator.Exceptions.InvalidState} If the grid isn't marked as having resizers
     */
    removeResizers(grid) {
        const nodeType = grid.getAttribute('type');
        if (nodeType != 'mainGrid') {
            throw new this.Exceptions.InvalidType('Cannot remove resizers in grid of type <' + nodeType + '>. Should be <mainGrid>');
        }
        if (!this.hasResizers(grid)) {
            throw new this.Exceptions.InvalidState('Cannot remove resizers on a grid which doesn\'t have any');
        }

        // remove each resizers
        _(grid.querySelectorAll('resizer')).forEach(resizer => resizer.parentNode.removeChild(resizer));

        grid.removeAttribute('hasResizers');
    }
};

// Exceptions must be based on the Error class
Exceptions.normalize(Manipulator.Exceptions);

export { Manipulator };
