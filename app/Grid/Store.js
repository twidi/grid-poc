import _ from 'lodash';
import flux from 'flux-react';

import { Actions } from './Actions';
import { Manipulator } from './Manipulator';


/**
 * The Grid store. This is the public interface
 * @namespace
 * @memberOf module:Grid
 */
let Store = {

    /**
     * Exceptions for the Store module
     * @namespace
     */
    Exceptions: {
        /**
         * Exception raised when a grid does not exist
         * This is a subclass of "Error"
         * @class
         *
         * @param {string} [message] - The raised message
         *
         * @property {string} name - The name of the exception: "GridDoesNotExist"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        GridDoesNotExist: function GridDoesNotExist(message) {
            this.name = 'GridDoesNotExist';
            this.message = message || 'Grid does not exist';
        },
        /**
         * Exception raised when a node does not exist
         * This is a subclass of "Error"
         * @class
         *
         * @param {string} [message] - The raised message
         *
         * @property {string} name - The name of the exception: "NodeDoesNotExist"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        NodeDoesNotExist: function NodeDoesNotExist(message) {
            this.name = 'NodeDoesNotExist';
            this.message = message || 'Node does not exist';
        },
        /**
         * Exception raised when a design mode step is not valid
         * This is a subclass of "Error"
         * @class
         *
         * @param {string} [message] - The raised message
         *
         * @property {string} name - The name of the exception: "InvalidDesignModeStep"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        InvalidDesignModeStep: function InvalidDesignModeStep(message) {
            this.name = 'InvalidDesignModeStep';
            this.message = message || 'Design mode step is invalid';
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
        Inconsistency: function Inconsistency(message) {
            this.name = 'Inconsistency';
            this.message = message || 'Inconsistency detected';
        },

        /**
         * Exception raised when an history manipulation cannot be done because it's out of bound.
         * This is a subclass of "Error"
         * @class
         *
         * @param {string} [message] - The raised message
         *
         * @property {string} name - The name of the exception: "HistoryOutOfBound"
         * @property {string} message - The message passed when the exception was raised, or a default value
         */
        HistoryOutOfBound: function HistoryOutOfBound(message) {
            this.name = 'HistoryOutOfBound';
            this.message = message || 'Operation out of bound on history';
        },
    },

    /**
     * Get a grid from the store by its name. All nodes are ensured to have an ID.
     *
     * @param  {string} gridName - Name of the grid to get
     *
     * @return {XML} - The wanted XML grid
     */
    getGrid(gridName) {
        const grid = this.getGridEntry(gridName);
        Manipulator.setIds(grid.grid);
        return grid.grid;
    },

    /**
     * Get a node from the store by the grid name and the node id.
     * It may be the grid root node
     *
     * @param  {string} gridName - Name of the grid to get
     * @param  {string} nodeId - Id of the grid node to get
     *
     * @return {XML} - The wanted XML node
     *
     * @throws {module:Grid.Store.Exceptions.GridDoesNotExist} If the given name does not match an existing grid name
     * @throws {module:Grid.Store.Exceptions.NodeDoesNotExist} If the given id does not match an existing node id
     */
    getGridNodeById(gridName, nodeId) {
        const grid = this.getGrid(gridName);
        if (grid.getAttribute('id') == nodeId) {
            return grid;
        }
        const node = grid.querySelector('#' + nodeId);
        if (!node) {
            throw new this.Exceptions.NodeDoesNotExist('No node with the ID <' + nodeId + '>');
        }
        return node;
    },

    /**
     * Return the id attribute of the given node
     *
     * @param  {XML} node - The XML node for which we want the id
     *
     * @return {string} - The id attribute of the node
     */
    getNodeId(node) {
        return node.getAttribute('id');
    },

    /**
     * Return the main grid for the given node
     *
     * @param  {XML} node - The XML node for which we want the grid
     *
     * @return {XML} - The main grid of the node
     */
    getMainGrid(node) {
        return node.ownerDocument.documentElement;
    },

    /**
     * Return the name of the main grid
     *
     * @param  {XML} node - The XML node for which we want the grid
     *
     * @return {string} - The name of the main grid
     */
    getMainGridName(node) {
        return this.getMainGrid(node).getAttribute('name');
    },

    /**
     * Get the design mode step for a grid from the store by its name.
     *
     * @param  {string} gridName - Name of the grid for which we want the design mode step
     *
     * @return {string} - The current design mode step of the grid
     */
    getDesignModeStep(gridName) {
        const grid = this.getGridEntry(gridName);
        return grid.designModeStep;
    },

    /**
     * Tell if the given grid is in dragging mode (a module cell is currently dragged by the user)
     *
     * @param  {string} gridName - Name of the grid for which we want to know if it is in dragging mode
     *
     * @return {Boolean} - `true` if the grid is in dragging mode, else `false`
     */
    isDragging(gridName) {
        const draggingNode = this.grids[gridName].nodes.dragging;
        return !!draggingNode;
    },

    /**
     * Tell if the given cell is the one currently dragged on the given grid
     *
     * @param  {string} gridName - Name of the grid for which we want to do the check
     * @param  {XML}  cell - The cell we want to check if it's the currently dragged one
     *
     * @return {Boolean} - `true` if the cell is the currently dragged one,or `false`
     */
    isDraggingCell(gridName, cell) {
        const draggingNode = this.grids[gridName].nodes.dragging;
        if (!draggingNode) { return false; }
        return draggingNode.getAttribute('id') == cell.querySelector(':scope > content').getAttribute('id');
    },

    /**
     * Tell if the given grid is in hovering mode (a module cell is currently hover a placeholder)
     *
     * @param  {string} gridName - Name of the grid for which we want to know if it is in hovering mode
     *
     * @return {Boolean} - `true` if the grid is in hovering mode, else `false`
     */
    isHovering(gridName) {
        const hoveringNode = this.grids[gridName].nodes.hovering;
        return !!hoveringNode;
    },

    /**
     * Tell if the given placeholder is the one currently hovered on the given grid
     *
     * @param  {string} gridName - Name of the grid for which we want to do the check
     * @param  {XML}  placeholder - The placeholder we want to check if it's the currently hovered one
     *
     * @return {Boolean} - `true` if the placeholder is the currently hovered one,or `false`
     */
    isHoveringPlaceholder(gridName, placeholder) {
        const hoveringNode = this.grids[gridName].nodes.hovering;
        if (!hoveringNode) { return false; }
        return hoveringNode.getAttribute('id') == placeholder.getAttribute('id');
    },

    /**
     * Tell if the given grid is in resizing mode (a resizing node is currently dragged by the user)
     *
     * @param  {string} gridName - Name of the grid for which we want to know if it is in resizing mode
     *
     * @return {Boolean} - `true` if the grid is in resizing mode, else `false`
     */
    isResizing(gridName) {
        const resizingNode = this.grids[gridName].nodes.resizing;
        return !!resizingNode;
    },

    /**
     * Tell if the given resizer is the one currently dragged on the given grid
     *
     * @param  {string} gridName - Name of the grid for which we want to do the check
     * @param  {XML}  resizer - The resizer we want to check if it's the currently dragged one
     *
     * @return {Boolean} - `true` if the resizer is the currently dragged one,or `false`
     */
    isMovingResizer(gridName, resizer) {
        const resizingNode = this.grids[gridName].nodes.resizing;
        if (!resizingNode) { return false; }
        return resizingNode.getAttribute('id') == resizer.getAttribute('id');
    },

    /**
     * Tell if the given node contains a subgrid.
     *
     * @param  {XML} node - The XML node to check for sub grids
     *
     * @return {Boolean} - `true` if the node contains at least one subgrid, or `false`
     */
    containsSubGrid(node) {
        return Manipulator.containsSubGrid(node);
    },

    /**
     * Tell if the grid has placeholders
     *
     * @param  {string} gridName - Name of the grid for which we want to know if it has placeholders
     *
     * @return {Boolean} - `true` if the grid has placeholders, else `false`
     */
    hasPlaceholders(gridName) {
        const grid = this.getGrid(gridName);
        return Manipulator.hasPlaceholders(grid);
    },

    /**
     * Tell if the grid has resizers
     *
     * @param  {string} gridName - Name of the grid for which we want to know if it has resizers
     *
     * @return {Boolean} - `true` if the grid has resizers, else `false`
     */
    hasResizers(gridName) {
        const grid = this.getGrid(gridName);
        return Manipulator.hasResizers(grid);
    },

    /**
     * Return the value of the "relativeSize" attribute of the given node
     *
     * @param  {XML} node - The node for which we want the size
     *
     * @return {Float} - The float-converted value of the attribute, or 1 if not defined
     */
    getRelativeSize(node) {
        return parseFloat(node.getAttribute('relativeSize') || 1);
    },

    /**
     * Tell if we can go back in history ("undo") for the given grid
     *
     * @param  {String} gridName - The name of the grid for which we ask
     *
     * @return {Boolean} - `true` if an "undo" can be done, or `false`
     */
    canGoBackInHistory(gridName) {
        const gridEntry = this.getGridEntry(gridName);
        return (gridEntry.currentHistoryIndex > 0);
    },

    /**
     * Tell if we can go forward in history ("redo") for the given grid
     *
     * @param  {String} gridName - The name of the grid for which we ask
     *
     * @return {Boolean} - `true` if a "redo" can be done, or `false`
     */
    canGoForwardInHistory(gridName) {
        const gridEntry = this.getGridEntry(gridName);
        return (gridEntry.currentHistoryIndex < gridEntry.history.length - 1);
    },

    /**
     * Remove all the grids
     *
     * @private
     *
     * @returns {} - Returns nothing
     */
    __removeAllGrids() {
        for (const gridName in this.grids) {
            delete this.grids[gridName];
        }
    },
};


/**
 * Private interface of the Store module. Everything can only be accessed inside the Store itself
 * @namespace
 * @memberOf module:Grid.Store
 * @inner
 *
 */
const Private = {

    /**
     * Duration (in ms) to take an hovering into account
     * @type {Number}
     */
    hoveringDelay: 500,

    /**
     * All stored grids, by name, each entry having:
     * @type {Object}
     * @property {string} name - The name of the grid
     * @property {XML} grid - The XML grid
     * @property {string} designModeStep - The current design mode step for this grid
     *
     * @property {Array} history - History of grids to allow undo/redo
     * @property {Integer} currentHistoryIndex - The current index in history
     *
     * @property {Object} backups - Some backups of previous states needed during the drag and drop process
     * @property {Object} backups.dragging - The grid before starting the dragging process
     * @property {Object} backups.hovering - The grid after starting the dragging process, before hovering on a placeholder
     *
     * @property {Object} nodes - References to some node that are manipulated throug the drag and drop process
     * @property {Object} nodes.dragging - The node currently being dragged
     * @property {Object} nodes.hovering - The placeholder node currently being hovered by the dragged node
     * @property {Object} nodes.resizing - The resizer node currently being moved
     *
     * @property {timeout} hoveringTimeout - The timeout to take hovering into account
     *
     * @property {Object} resizing - Some data to hold current state of resizing
     * @property {Integer} resizing.initialPos - Initial position of the mouse when the resizing started (X if vertical resizer, Y if horizontal)
     * @property {Float} resizing.previousRelativeSize - The initial related size of the previous node
     * @property {Float} resizing.nextRelativeSize - The initial related size of the next node
     * @property {Float} resizing.sizeRatio - The ratio to use to compute new relative size., based on fullsize given when resizing started, and the full relative size
     */
    grids: {},

    /**
     * All valid design mode steps as keys, and accepted next step as values (array)
     * @type {Object}
     * @readonly
     *
     * @property {string} disabled
     * The design mode is not activated.
     *
     * It can go to:
     * - `enabled` if the design mode is activated.
     *
     * @property {string} enabled
     * The design mode is activated, waiting for dragging to start.
     *
     * It can go to
     * - `disabled` if the design mode is deactivated.
     * - `dragging` if a module starts being dragged.
     * - `resizing` if a resizing handler is being moved
     *
     * @property {string} resizing
     * The resizing has started.
     *
     * It can go to:
     * - `enabled` if the resizing has stopped
     *
     * @property {string} dragging
     * The dragging has started, waiting for hovering.
     *
     * It can go to:
     * - `enabled` if a module stops being dragged
     * - `prehovering` if the module enter a placeholder
     *
     * @property {string} prehovering
     * The dragged module is hover a placeholder, for a short time
     *
     * It can go to:
     * - `dragging` if the module exit the placeholder
     * - `hovering` if the module stays a little longer on the placeholder
     * - `enabled` if the dragged module is dropped.
     *
     * @property {string} hovering
     * The dragged element is hover a placeholder.
     *
     * It can go to:
     * - `dragging` if the dragged module moves again.
     * - `enabled` if the dragged module is dropped.
     *
     */
    designModeValidSteps: {
        'disabled': ['enabled'],
        'enabled': ['disabled', 'dragging', 'resizing'],
        'resizing': ['enabled'],
        'dragging': ['enabled', 'prehovering'],
        'prehovering': ['dragging', 'hovering', 'enabled'],
        'hovering': ['dragging', 'enabled']
    },


    actions: _.values(Actions),


    /**
     * Get a grid and its associated data from the store by its name.
     *
     * @param  {string} gridName - Name of the grid to get
     *
     * @return {Object}
     *
     * An object containing:
     *
     * - `grid`: the XML grid
     * - `designModeStep`: the current design mode step for the grid
     *
     * @throws {module:Grid.Store.Exceptions.GridDoesNotExist} If the given name does not match an existing grid name
     */
    getGridEntry(gridName) {
        if (!_.has(this.grids, gridName)) {
            throw new this.Exceptions.GridDoesNotExist('No grid with the name <' + gridName + '>');
        }
        return this.grids[gridName];
    },

    /**
     * Add a grid to the list of grids.
     * It's an action, should be called via
     * {@link module:Grid.Actions.enterDesignMode Grid.Actions.addGrid}
     *
     * @param {XML} grid - The grid to add to the list
     *
     * @fires module:Grid.Store#"grid.add"
     */
    addGrid(grid) {
        const name = grid.getAttribute('name');
        if (_.has(this.grids, name)) {
            throw new this.Exceptions.GridDoesNotExist('There is already a grid the name <' + name + '>');
        }
        this.grids[name] = {
            name: name,
            grid: grid,
            designModeStep: 'disabled',
            history: [],
            currentHistoryIndex: -1.0,
            backups: {},
            nodes: {},
            hoveringTimeout: null,
            resizing: {},
        };

        // starting point of this grid history
        this.addCurrentGridToHistory(name);

        /**
         * Event fired when a grid is added to the Grid store
         *
         * @event module:Grid.Store#"grid.add"
         *
         * @property {string} name - The name of the added Grid
         */
        this.emit('grid.add', name);
    },

    /**
     * Add a module to the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.enterDesignMode Grid.Actions.addModule}
     *
     * @param {String} gridName - The name of the grid on which to add the module
     * @param {String} module - The path of the module to use
     * @param {Object} params - An flat object with all attributes of this module
     *
     * @fires module:Grid.Store#"grid.designMode.module.add"
     */
    addModule(gridName, module, params) {
        const grid = this.getGrid(gridName);

        const hasResizers = Manipulator.hasResizers(grid);

        // remove resizers for now
        if (hasResizers) {
            Manipulator.removeResizers(grid);
        }

        // create a content node, including the module name as an attribute
        const attributes = _.extend({component: module}, params);
        const contentNode = Manipulator.createContentNode(grid, attributes);

        // add a row with this module only
        const firstRow = grid.querySelector('row');
        const newRow = Manipulator.addRow(grid, firstRow);
        const newCell = Manipulator.addCell(newRow, null, 'module', contentNode);

        // put the grid in a good state
        if (hasResizers) {
            Manipulator.addResizers(grid);
        }
        Manipulator.setIds(grid);

        // grid changed, add it to history
        this.addCurrentGridToHistory(gridName);

        /**
         * Event fired when a module is added to a grid
         *
         * @event module:Grid.Store#"grid.designMode.module.add"
         *
         * @property {string} name - The name of the updated Grid
         */
        this.emit('grid.designMode.module.add', gridName);
    },

    /**
     * Remove a module from the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.enterDesignMode Grid.Actions.removeModule}
     *
     * @param  {String} gridName - The grid from which we want to remove the module
     * @param  {XML} moduleCell - The module cell to remove
     *
     * @fires module:Grid.Store#"grid.designMode.module.remove"
     */
    removeModule(gridName, moduleCell) {
        const grid = this.getGrid(gridName);

        const hasResizers = Manipulator.hasResizers(grid);

        // remove resizers for now
        if (hasResizers) {
            Manipulator.removeResizers(grid);
        }

        Manipulator.removeCell(moduleCell);
        if (hasResizers) {
            Manipulator.addResizers(grid);
        }

        // grid changed, add it to history
        this.addCurrentGridToHistory(gridName);

        /**
         * Event fired when a module is removed from a grid
         *
         * @event module:Grid.Store#"grid.designMode.module.remove"
         *
         * @property {string} name - The name of the updated Grid
         */
        this.emit('grid.designMode.module.remove', gridName);
    },

    /**
     * Set design mode for the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.enterDesignMode Grid.Actions.enterDesignMode}
     *
     * @param {string} gridName - The name of the grid for witch we want to enter the design mode
     *
     * @fires module:Grid.Store#"grid.designMode.enter"
     */
    enterDesignMode(gridName) {
        this.changeDesignModeStep(gridName, 'enabled');

        /**
         * Event fired when a grid enters design mode
         *
         * @event module:Grid.Store#"grid.designMode.enter"
         *
         * @property {string} gridName - The name of the updated grid
         */
        this.emit('grid.designMode.enter', gridName);
    },

    /**
     * Exit design mode for the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.exitDesignMode Grid.Actions.exitDesignMode}
     *
     * @param {string} gridName - The name of the grid for witch we want to exit the design mode
     *
     * @fires module:Grid.Store#"grid.designMode.exit"
     */
    exitDesignMode(gridName) {
        this.changeDesignModeStep(gridName, 'disabled');

        /**
         * Event fired when a grid exits design mode
         *
         * @event module:Grid.Store#"grid.designMode.exit"
         *
         * @property {string} gridName - The name of the updated grid
         */
        this.emit('grid.designMode.exit', gridName);
    },

    /**
     * Set the design mode step for the given grid. Add/remove placeholders and resizers if needed
     *
     * @param {string} gridName - The XML grid for which we want to change de design mode step
     * @param {string} step - The new step ("disabled", "enabled", "dragging", "hovering")
     * @param {boolean} [dontManageGrid] - If true, won't add or remove placeholders/resizers, don't manage grid ids
     *
     * @return {} - Returns nothing
     */
    changeDesignModeStep(gridName, step, dontManageGrid) {
        const grid = this.getGrid(gridName);

        if (typeof this.designModeValidSteps[step] == 'undefined') {
            throw new this.Exceptions.InvalidDesignModeStep('The given design mode step <' + step + '> is not a valid one');
        }

        const currentStep = this.getDesignModeStep(gridName);

        if (currentStep == step) {
            return;
        }

        if (!_.contains(this.designModeValidSteps[currentStep], step)) {
            throw new this.Exceptions.InvalidDesignModeStep('The given design mode step <' + step + '> is not valid step to go after the current one which is <' + currentStep + '>');
        }

        if (!dontManageGrid) {
            const gridHasPlaceholders = Manipulator.hasPlaceholders(grid);
            const gridHasResizers = Manipulator.hasResizers(grid);

            if (!(step == 'dragging' || step == 'prehovering') && gridHasPlaceholders) {
                Manipulator.removePlaceholders(grid);
            }
            if (!(step == 'enabled' || step == 'resizing') && gridHasResizers) {
                Manipulator.removeResizers(grid);
            }
            if ((step == 'dragging' || step == 'prehovering') && !gridHasPlaceholders) {
                Manipulator.addPlaceholders(grid);
            }
            if ((step == 'enabled' || step == 'resizing') && !gridHasResizers) {
                Manipulator.addResizers(grid);
            }

            Manipulator.setIds(grid);
        }

        this.setDesignModeStep(gridName, step);
    },


    /**
     * Set the design mode step for a grid from the store by its name.
     *
     * @param  {string} gridName - Name of the grid for which we want to set design mode step
     * @param {string} step - The new design mode step for the grid
     */
    setDesignModeStep(gridName, step) {
        const grid = this.getGridEntry(gridName);
        grid.designModeStep = step;
    },

    /**
     * Check that a gridName is valid, and if the node is given, if it belongs to this grid
     *
     * @param  {string} gridName - The grid name to check
     * @param  {XML} [node] - The node to check
     *
     * @returns {XML} - The node, eventually updated to be the actual one in the grid
     *
     * @throws {module:Grid.Store.Exceptions.GridDoesNotExist} If the given name does not match an existing grid name
     * @throws {module:Grid.Store.Exceptions.Inconsistency} If the given node does not belongs to the grid
     */
    checkConsistency(gridName, node) {
        const grid = this.getGrid(gridName);
        if (node) {
            try {
                const actualNode = this.getSameNodeInActualGrid(gridName, node);
            } catch (e) {
                throw new this.Exceptions.Inconsistency('The given cell is not contained in the grid <' + gridName + '>');
            }
        }
        return node;
    },

    /**
     * Make a named backup of a grid.
     * The backup is a reference to the actual grid, and the actual grid is replaced by a clone
     *
     * @param  {string} gridName - The name of the grid to backup
     * @param  {string} backupName - The name of this backup. Should be "dragging" or "hovering"
     */
    backupGrid(gridName, backupName) {
        const actualGrid = this.grids[gridName].grid;
        this.grids[gridName].backups[backupName] = actualGrid;
        this.grids[gridName].grid = Manipulator.clone(actualGrid);
    },

    /**
     * Restore a named backup of a grid.
     * The backup will be removed and the actuel grid will be lost
     *
     * @param  {string} gridName - The name of the grid for which we want to restore its backup
     * @param  {string} backupName - The name of the backup to restore
     *
     * @return {XML} - The backuped grid now restored
     */
    restoreGrid(gridName, backupName) {
        const backup = this.grids[gridName].backups[backupName];
        if (backup) {
            this.grids[gridName].grid = backup;
            this.clearBackupedGrid(gridName, backupName);
            return this.grids[gridName].grid;
        }
    },

    /**
     * Clear a named backup of a grid. Doesn't fail if the backup doesn't exist
     *
     * @param  {string} gridName - The name of the grid for which we want to clear its backup
     * @param  {string} backupName - The name of the backup we want to clear
     */
    clearBackupedGrid(gridName, backupName) {
        try {
            delete this.grids[gridName].backups[backupName];
        } catch (e) {}
    },

    /**
     * Save the reference of a grid node, with a specific name
     *
     * @param  {string} gridName - The name of the grid for which we want to save a node
     * @param  {XML} node - The XML grid node we want to save a reference for
     * @param  {string} saveName - The name of the saving node, for later reference
     */
    saveNode(gridName, node, saveName) {
        this.grids[gridName].nodes[saveName] = node;
    },

    /**
     * Return a node in a grid, searching by the ID of the given node.
     * It may not be the same node if the grid was backuped
     *
     * @param  {string} gridName - The grid in which to search for the given node
     * @param  {XML} node - The node we want to find in the grid, using its ID
     *
     * @return {XML} - The wanted node from the actual grid
     */
    getSameNodeInActualGrid(gridName, node) {
        return this.getGridNodeById(gridName, node.getAttribute('id'));
    },

    /**
     * Get a previously saved reference to a grid node.
     * Ensure that the node returned is in the actual grid and not in a backup, except if dontUpdate is true
     *
     * @param  {string} gridName - The name of the grid for which we want the reference node
     * @param  {string} saveName - The name used in `saveNode` to get the reference back
     * @param  {boolean} [dontUpdate] - Do not try to find the node in the actual grid (if the node was removed for example)
     *
     * @return {XML} - The wanted node grid (or null if not found)
     */
    getSavedNode(gridName, saveName, dontUpdate) {
        // get the reference actually saved
        const oldNode = this.grids[gridName].nodes[saveName];
        // Stop if we don't have this node
        if (!oldNode) {
            return null;
        }
        // If we don't want to search in the actual grid and update, stop here
        if (dontUpdate) {
            return oldNode;
        }
        // search for one with the same id in the actual grid (which may be different, if
        // backuped for example)
        const newNode = this.getSameNodeInActualGrid(gridName, oldNode);
        // save the new node
        this.saveNode(gridName, newNode, saveName);
        // return the node in the actual grid
        return newNode;
    },

    /**
     * Clear a named reference to a grid node. Doesn't fail if the reference doesn't exist
     * @param  {string} gridName - The name of the grid for which we want to clear the reference
     * @param  {string} saveName - The name of the used in `saveNode` of the reference to clear
     */
    clearSavedNode(gridName, saveName) {
        try {
            delete this.grids[gridName].nodes[saveName];
        } catch (e) {}
    },

    /**
     * Set the timeout to enter the "stay hovering" mode
     *
     * @param {string} gridName - The grid we work with
     */
    setHoveringTimeout(gridName) {
        this.clearHoveringTimeout(gridName);
        this.getGridEntry(gridName).hoveringTimeout = setTimeout(() => {
            try {
                // the grid may not exist anymore
                this.checkConsistency(gridName);
            } catch (e) {
                return;
            }
            this.stayHovering(gridName);
        }, this.hoveringDelay);
    },

    /**
     * Clear the timeout to enter the "stay hovering" mode
     *
     * @param {string} gridName - The grid we work with
     */
    clearHoveringTimeout(gridName) {
        const timeout = this.getGridEntry(gridName).hoveringTimeout;
        if (timeout) {
            clearTimeout(timeout);
            this.getGridEntry(gridName).hoveringTimeout = null;
        }
    },


    /**
     * Start dragging the given module in the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.startDragging Grid.Actions.startDragging}
     *
     * @param {string} gridName - The name of the grid for witch we want to stop dragging
     *
     * @fires module:Grid.Store#"grid.designMode.dragging.start"
     */
    startDragging(gridName, moduleCell) {
        try {
            moduleCell = this.checkConsistency(gridName, moduleCell);

            // make a backup copy of the grid without placeholders
            this.backupGrid(gridName, 'dragging');

            // use cell from the new grid
            moduleCell = this.getSameNodeInActualGrid(gridName, moduleCell);

            // remove the cell from the grid
            const contentNode = moduleCell.querySelector(':scope > content');
            Manipulator.removeContentNode(contentNode);

            // save the cell as the dragging one for this grid
            this.saveNode(gridName, contentNode, 'dragging');

            // set design step do "dragging"
            this.changeDesignModeStep(gridName, 'dragging');

            /**
             * Event fired when a module starts to be dragged over a grid
             *
             * @event module:Grid.Store#"grid.designMode.dragging.start"
             *
             * @property {string} name - The name of the Grid when the dragging occurs
             */
            this.emit('grid.designMode.dragging.start', gridName);

        } catch (e) {
            // we had an error, restore to the previous state
            this.restoreGrid(gridName, 'dragging');
            this.clearSavedNode('dragging');
            if (this.getDesignModeStep(gridName) == 'dragging') {
                this.changeDesignModeStep(gridName, 'enabled');
            }
        }
    },

    /**
     * Stop dragging the currently dragged module in the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.cancelDragging Grid.Actions.cancelDragging}
     *
     * @param {string} gridName - The name of the grid for witch we want to stop dragging
     *
     * @fires module:Grid.Store#"grid.designMode.dragging.stop"
     */
    cancelDragging(gridName) {
        this.checkConsistency(gridName);

        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // set design step to "enabled" (don't manage the grid as we'll restore the it below)
        this.changeDesignModeStep(gridName, 'enabled', true);

        // restore the "dragging" grid backup
        this.restoreGrid(gridName, 'dragging');

        /**
         * Event fired when a module stop to be dragged over a grid
         *
         * @event module:Grid.Store#"grid.designMode.dragging.stop"
         *
         * @property {string} name - The name of the Grid when the dragging occurs
         */
        this.emit('grid.designMode.dragging.stop', gridName);

        // we don't need to keep a reference to the dragging module
        this.clearSavedNode(gridName, 'dragging');

        // clear "hovering" backup if exists
        this.clearBackupedGrid(gridName, 'hovering');
    },

    /**
     * The currently dragged module stays on a placeholder.
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.startHovering Grid.Actions.startHovering}
     * @param {string} gridName - The name of the grid on witch the hovering occurs
     *
     * @fires module:Grid.Store#"grid.designMode.hovering.start"
     */
    startHovering(gridName, placeholderCell) {
        placeholderCell = this.checkConsistency(gridName, placeholderCell);

        if (!placeholderCell) { return; }

        const currentHovering = this.getSavedNode(gridName, 'hovering');

        // we already have an hovering cell...
        if (currentHovering) {
           // do nothing if existing hovering is the same
            if (currentHovering == placeholderCell
                    || currentHovering.getAttribute('id') == placeholderCell.getAttribute('id')) {
                return;
            }
            // if other than the actual, cancel the hovering
            this.stopHovering(gridName);
        }

        // stop the existing delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // save the cell as the hovering one for this grid
        this.saveNode(gridName, placeholderCell, 'hovering');

        // Do not activate the rendering now
        this.setHoveringTimeout(gridName);

        // set design step to "prehovering"
        this.changeDesignModeStep(gridName, 'prehovering');

        /**
         * Event fired when a dragged module starts to hover a placeholder
         *
         * @event module:Grid.Store#"grid.designMode.hovering.start"
         *
         * @property {string} name - The name of the Grid when the dragging occurs
         */
        this.emit('grid.designMode.hovering.start', gridName);
    },

    /**
     * The currently dragged module is hovering a placeholder for a certain delay
     *
     * @param {string} gridName - The name of the grid on witch the hovering occurs
     *
     * @fires module:Grid.Store#"grid.designMode.hovering.stay"
     */
    stayHovering(gridName) {
        this.checkConsistency(gridName);

        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // stop if we're not in pre-hovering mode (the timeout should have been killed, but...)
        if (this.getDesignModeStep(gridName) != 'prehovering') {
            return;
        }

        // make a backup copy of the grid with placeholders
        this.backupGrid(gridName, 'hovering');

        // use placeholder from the new grid
        const placeholderCell = this.getSavedNode(gridName, 'hovering');

        // attach the dragged module to the placeholder
        const draggedContent = this.getSavedNode(gridName, 'dragging', true);
        Manipulator.moveContentToPlaceholder(draggedContent, placeholderCell);

        // save the cell as the hovering one for this grid
        this.saveNode(gridName, placeholderCell, 'hovering');

        // set design step to "hovering"
        this.changeDesignModeStep(gridName, 'hovering');

        /**
         * Event fired when a dragged module stay over a placeholder a long
         * time, the placeholder being replaced by the module
         *
         * @event module:Grid.Store#"grid.designMode.hovering.stay"
         *
         * @property {string} name - The name of the Grid where the dragging occurs
         */
        this.emit('grid.designMode.hovering.stay', gridName);
    },

    /**
     * The currently dragged module moves away from the placeholder it was hover.
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.stopHovering Grid.Actions.stopHovering}
     *
     * @param {string} gridName - The name of the grid on witch the hovering occurs
     * @param {XML} placeholderCell - The "placeholder" cell where we the module is hover
     *
     * @fires module:Grid.Store#"grid.designMode.hovering.stop"
     */
    stopHovering(gridName) {
        this.checkConsistency(gridName);

        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // if we were in hovering mode (hover for a "long" time), restore the "hovering" grid backup
        if (this.getDesignModeStep(gridName) == 'hovering') {
            this.restoreGrid(gridName, 'hovering');
        }

        // set design step to "dragging" (don't manage the grid as it was restored above)
        this.changeDesignModeStep(gridName, 'dragging', true);

        // we don't need to keep a reference to the hovered module
        this.clearSavedNode(gridName, 'hovering');

        /**
         * Event fired when a dragged module stops hovering a placeholder
         *
         * @event module:Grid.Store#"grid.designMode.hovering.stop"
         *
         * @property {string} name - The name of the Grid when the dragging occurs
         */
        this.emit('grid.designMode.hovering.stop', gridName);
    },

    /**
     * Drop the currently dragged module in the given placeholder.
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.drop Grid.Actions.drop}
     *
     * @param {string} gridName - The name of the grid for witch we want to start dragging
     * @param {XML} [placeholderCell] - The "placeholder" cell we want the dragging cell
     * to be dropped on. If defined, will replace the one saved in the store.
     *
     * @fires module:Grid.Store#"grid.designMode.drop"
     */
    drop(gridName, placeholderCell) {
        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // ensure that placeholderCell belongs to the correct grid
        if (placeholderCell) {
            placeholderCell = this.getSameNodeInActualGrid(gridName, placeholderCell);
        }

        // retrieve the currently hovered placeholder
        const existingPlaceholderCell = this.getSavedNode(gridName, 'hovering');

        // if there is an existing placeholder, but the one given differs, use the one given
        if (placeholderCell && placeholderCell != existingPlaceholderCell) {
            this.startHovering(gridName, placeholderCell);
            // but don't go in stayHovering mode
            this.clearHoveringTimeout(gridName);
        } else {
            placeholderCell = existingPlaceholderCell;
            this.checkConsistency(gridName);
        }

        const designModeStep = this.getDesignModeStep(gridName);

        // cancel drop if we are back in dragging mode (we may have dropped after
        // exiting a placeholder)
        if (designModeStep == 'dragging') {
            this.cancelDragging(gridName);
            // should not be needed, but just in case, we are not sure in which order events will come
            this.clearBackupedGrid(gridName, 'hovering');
            this.clearSavedNode(gridName, 'hovering');
            return;
        }

        // attach the dragged module to the placeholder if we were in dragging mode
        // it happens it the drop came before the stay-hoveringTimeout
        if (designModeStep == 'prehovering') {
            const draggedContent = this.getSavedNode(gridName, 'dragging', true);
            Manipulator.moveContentToPlaceholder(draggedContent, placeholderCell);
        }

        // set design step to "enabled"
        this.changeDesignModeStep(gridName, 'enabled');

        // grid changed, add it to history
        this.addCurrentGridToHistory(gridName);

        /**
         * Event fired when a dragged module is dropped
         *
         * @event module:Grid.Store#"grid.designMode.drop"
         *
         * @property {string} name - The name of the Grid when the dragging occurs
         */
        this.emit('grid.designMode.drop', gridName);

        // clear backups if exists
        this.clearBackupedGrid(gridName, 'dragging');
        this.clearBackupedGrid(gridName, 'hovering');
        this.clearSavedNode(gridName, 'dragging');
        this.clearSavedNode(gridName, 'hovering');
    },

    /**
     * Start moving the given resizer on the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.drop Grid.Actions.startResizing}
     *
     * @param  {string} gridName - The name of the grid on witch the resizing occurs
     * @param  {XML} resizer - The resizer of the grid beingmoved
     * @param  {Integer} fullSize - The full size (height if horizontal resizer, or width) of the previous and next nodes
     * @param  {Integer} initialPos - The position of the mouse acting as a starting point for the resizing
     *
     * @fires module:Grid.Store#"grid.designMode.resizing.start"
     */
    startResizing(gridName, resizer, fullSize, initialPos) {
        this.checkConsistency(gridName);

        // save the resizer as the resizer being moved for this grid
        this.saveNode(gridName, resizer, 'resizing');

        // get existing relative size information
        const previousRelativeSize = this.getRelativeSize(resizer.previousSibling);
        const nextRelativeSize = this.getRelativeSize(resizer.nextSibling);

        // and save computed data
        const gridEntry = this.getGridEntry(gridName);
        gridEntry.resizing = {
            initialPos: initialPos,
            previousRelativeSize:  previousRelativeSize,
            nextRelativeSize:  nextRelativeSize,
            sizeRatio:  (previousRelativeSize + nextRelativeSize) / fullSize,
        };

        // set design step to "resizing"
        this.changeDesignModeStep(gridName, 'resizing');

        /**
         * Event fired when a resizer starts to be moved
         *
         * @event module:Grid.Store#"grid.designMode.resizing.start"
         *
         * @property {string} name - The name of the Grid when the resizing occurs
         */
        this.emit('grid.designMode.resizing.start', gridName);
    },

    /**
     * Move a resizer to resize its previous and next nodes
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.drop Grid.Actions.resize}
     *
     * @param  {string} gridName - The name of the grid on witch the resizing occurs
     * @param  {Integer} currentPos - The position of the mouse at the moment where the action is called
     *                                to compute the new sizes of the previous and next nodes
     *
     * @fires module:Grid.Store#"grid.designMode.resizing.move"
     */
    resize(gridName, currentPos) {
        this.checkConsistency(gridName);

        const resizing = this.getGridEntry(gridName).resizing;

        // compute new related sizes based on the new position
        const relatedDiff = (currentPos - resizing.initialPos) * resizing.sizeRatio;
        const newPreviousRelativeSize = resizing.previousRelativeSize + relatedDiff;
        const newNextRelativeSize = resizing.nextRelativeSize - relatedDiff;

        // we are out of bound, so we don't do anything
        if (newPreviousRelativeSize <= 0 || newNextRelativeSize <= 0) {
            return;
        }

        const eventData = {
            previousRelativeSize: newPreviousRelativeSize,
            nextRelativeSize: newNextRelativeSize,
        };

        /**
         * Event fired when a resizer is moved over the grid
         *
         * @event module:Grid.Store#"grid.designMode.resizing.move"
         *
         * @property {string} name - The name of the Grid when the resizing occurs
         */
        this.emit('grid.designMode.resizing.move', gridName, eventData);

        // save relative sizes in the grid
        const resizer = this.getSavedNode(gridName, 'resizing');
        resizer.previousSibling.setAttribute('relativeSize', newPreviousRelativeSize);
        resizer.nextSibling.setAttribute('relativeSize', newNextRelativeSize);
    },

    /**
     * Stop moving the given resizer on the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.drop Grid.Actions.stopResizing}
     *
     * @param  {string} gridName - The name of the grid on witch the resizing occurs
     *
     * @fires module:Grid.Store#"grid.designMode.resizing.stop"
     */
    stopResizing(gridName) {
        this.checkConsistency(gridName);

        // set design step to "enabled"
        this.changeDesignModeStep(gridName, 'enabled');

        /**
         * Event fired when a resizer is released
         *
         * @event module:Grid.Store#"grid.designMode.resizing.stop"
         *
         * @property {string} name - The name of the Grid when the resizing occurs
         */
        this.emit('grid.designMode.resizing.stop', gridName);

        // add the grid in history if it really changed
        const resizer = this.getSavedNode(gridName, 'resizing');
        if (!resizer) return;
        const currentPreviousRelativeSize = this.getRelativeSize(resizer.previousSibling);
        const currentNextRelativeSize = this.getRelativeSize(resizer.nextSibling);
        const resizing = this.getGridEntry(gridName).resizing;
        if (resizing.previousRelativeSize != currentPreviousRelativeSize || resizing.nextRelativeSize != currentNextRelativeSize) {
            this.addCurrentGridToHistory(gridName);
        }

        // clear saved not if exists, and working data
        this.clearSavedNode(gridName, 'resizing');
        this.getGridEntry(gridName).resizing = {};
    },

    /**
     * Add the current iteration of the given grid to the history
     *
     * The exact version of the actual grid will be saved in history, and the
     * current grid will be replaced by a clone to avoid updating the one in
     * history with manipulations done later
     *
     * It will also reset the "forward" possibilities
     *
     * @param {String} gridName - The name of the grid for which we want to update the history
     */
    addCurrentGridToHistory(gridName) {
        const gridEntry = this.getGridEntry(gridName);

        // remove everything after the current index in the history => no forward possible
        gridEntry.history.splice(gridEntry.currentHistoryIndex + 1);

        // add the current grid in the history
        gridEntry.history.push(gridEntry.grid);
        gridEntry.currentHistoryIndex++;

        // make a copy for the next updates (to avoid updating the one in the history)
        gridEntry.grid = Manipulator.clone(gridEntry.grid);

        /**
         * Event fired when a new version of a grid is added to its history.
         *
         * @event module:Grid.Store#"grid.designMode.history.add"
         *
         * @property {string} name - The name of the Grid when the history was changed
         */
        this.emit('grid.designMode.history.add', gridName);
    },

    /**
     * Restore the actual pointed entry in the history of a grid to be used as
     * the current grid.
     *
     * Placeholders will be removed if there were any, resizers will be added if
     * some missed, and missing IDs will be set
     *
     * It's a clone of the entry in the history that will be restored. to avoid
     * updating the one in history with manipulations done later
     *
     * @param {String} gridName - The name of the grid for which we want to restore from the history
     */
    restoreFromCurrentHistoryIndex(gridName) {
        const gridEntry = this.getGridEntry(gridName);
        gridEntry.grid = Manipulator.clone(gridEntry.history[gridEntry.currentHistoryIndex]);
        if (Manipulator.hasPlaceholders(gridEntry.grid)) {
            Manipulator.removePlaceholders(gridEntry.grid);
        }
        if (!Manipulator.hasResizers(gridEntry.grid)) {
            Manipulator.addResizers(gridEntry.grid);
        }
        Manipulator.setIds(gridEntry.grid);
    },


    /**
     * Use the previous version of grid found in its history
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.drop Grid.Actions.goBackInHistory}
     *
     * @param  {string} gridName - The name of the grid on witch the undo occurs
     *
     * @fires module:Grid.Store#"grid.designMode.history.back"
     */
    goBackInHistory(gridName) {
        if (!this.canGoBackInHistory(gridName)) {
            throw new this.Exceptions.HistoryOutOfBound('Cannot go backward in history for grid <' + gridName + '>');
        }

        const gridEntry = this.getGridEntry(gridName);
        gridEntry.currentHistoryIndex--;

        this.restoreFromCurrentHistoryIndex(gridName);

        /**
         * Event fired when we go back to the previous version of a grid in its history
         *
         * @event module:Grid.Store#"grid.designMode.history.back"
         *
         * @property {string} name - The name of the Grid when the history was changed
         */
        this.emit('grid.designMode.history.back', gridName);
    },

    /**
     * Use the next version of grid found in its history
     *
     * It's an action, should be called via
     * {@link module:Grid.Actions.drop Grid.Actions.goForwardInHistory}
     *
     * @param  {string} gridName - The name of the grid on witch the redo occurs
     *
     * @fires module:Grid.Store#"grid.designMode.history.forward"
     */
    goForwardInHistory(gridName) {
        if (!this.canGoForwardInHistory(gridName)) {
            throw new this.Exceptions.HistoryOutOfBound('Cannot go forward in history for grid <' + gridName + '>');
        }

        const gridEntry = this.getGridEntry(gridName);
        gridEntry.currentHistoryIndex++;

        this.restoreFromCurrentHistoryIndex(gridName);

        /**
         * Event fired when we go forward to the next version of a grid in its history
         *
         * @event module:Grid.Store#"grid.designMode.history.forward"
         *
         * @property {string} name - The name of the Grid when the history was changed
         */
        this.emit('grid.designMode.history.forward', gridName);
    },

    // add the public interface
    exports: Store,

};

// hidden ref to private interface from the store, to access in tests
Private.exports.__private = Private;


// Exceptions must be based on the Error class
_(Store.Exceptions).forEach((exceptionClass, exceptionName) => {
    exceptionClass.prototype = new Error();
    exceptionClass.prototype.constructor = exceptionClass;
    exceptionClass.displayName = exceptionName;
});


Store = flux.createStore(Private);

Store.__private = Private;

// exceptions must be accessible via the private api too
Private.Exceptions = Store.Exceptions;

export { Store };
