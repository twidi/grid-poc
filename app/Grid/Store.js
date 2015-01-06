var _ = require('lodash');
var flux = require('flux-react');

var Actions = require('./Actions.js');
var Manipulator = require('./Manipulator.js');


/**
 * The Grid store. This is the public interface
 * @namespace
 * @memberOf module:Grid
 */
var Store = {

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
        },    },

    /**
     * Get a grid from the store by its name. All nodes are ensured to have an ID.
     *
     * @param  {string} gridName - Name of the grid to get
     *
     * @return {XML} - The wanted XML grid
     */
    getGrid: function(gridName) {
        var grid = this.getGridEntry(gridName);
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
    getGridNodeById: function(gridName, nodeId) {
        var grid = this.getGrid(gridName);
        if (grid.getAttribute('id') == nodeId) {
            return grid;
        }
        var node = grid.querySelector('#' + nodeId);
        if (!node) {
            throw new this.Exceptions.NodeDoesNotExist("No node with the ID <" + nodeId + ">");
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
    getNodeId: function(node) {
        return node.getAttribute('id');
    },

    /**
     * Return the main grid for the given node
     *
     * @param  {XML} node - The XML node for which we want the grid
     *
     * @return {XML} - The main grid of the node
     */
    getMainGrid: function(node) {
        return node.ownerDocument.documentElement;
    },

    /**
     * Return the name of the main grid
     *
     * @param  {XML} node - The XML node for which we want the grid
     *
     * @return {string} - The name of the main grid
     */
    getMainGridName: function(node) {
        return this.getMainGrid(node).getAttribute('name');
    },

    /**
     * Get the design mode step for a grid from the store by its name.
     *
     * @param  {string} gridName - Name of the grid for which we want the design mode step
     *
     * @return {string} - The current design mode step of the grid
     */
    getDesignModeStep: function(gridName) {
        var grid = this.getGridEntry(gridName);
        return grid.designModeStep;
    },

    /**
     * Remove all the grids
     *
     * @private
     *
     * @returns {} - Returns nothing
     */
    __removeAllGrids: function() {
        for (var gridName in this.grids) {
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
var Private = {

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
     * @property {Object} backups - Some backups of previous states needed during the drag and drop process
     * @property {Object} backups.dragging - The grid before starting the dragging process
     * @property {Object} backups.hovering - The grid after starting the dragging process, before hovering on a placeholder
     *
     * @property {Object} nodes - References to some node that are manipulated throug the drag and drop process
     * @property {Object} nodes.dragging - The node currently being dragged
     * @property {Object} nodes.hovering - The placeholder node currently being hovered by the dragged node
     *
     * @property {timeout} [hoveringTimeout] - The timeout to take hovering into account
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
        'enabled': ['disabled', 'dragging'],
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
    getGridEntry: function(gridName) {
        if (!_.has(this.grids, gridName)) {
            throw new this.Exceptions.GridDoesNotExist("No grid with the name <" + gridName + ">");
        }
        return this.grids[gridName];
    },

    /**
     * Add a grid to the list of grids.
     * It's an action, should be called via
     * {@link module:Grid.Actions.enterDesignMode Grid.Actions.addGrid}
     */
    addGrid: function(grid) {
        var name = grid.getAttribute('name');
        if (_.has(this.grids, name)) {
            throw new this.Exceptions.GridDoesNotExist("There is already a grid the name <" + name + ">");
        }
        this.grids[name] = {
            name: name,
            grid: grid,
            designModeStep: 'disabled',
            backups: {},
            nodes: {},
            timeout: null,
        };
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
     * Set design mode for the given grid.
     * It's an action, should be called via
     * {@link module:Grid.Actions.enterDesignMode Grid.Actions.enterDesignMode}
     */
    enterDesignMode: function(gridName) {
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
     * It's an action, should be called via
     * {@link module:Grid.Actions.exitDesignMode Grid.Actions.exitDesignMode}
     */
    exitDesignMode: function(gridName) {
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
     * Set the design mode step for the given grid
     *
     * @param {string} gridName - The XML grid for which we want to change de design mode step
     * @param {string} step - The new step ("disabled", "enabled", "dragging", "hovering")
     * @param {boolean} [dontManageGrid] - If true, won't add or remove placeholders, don't manage grid ids
     *
     * @return {} - Returns nothing
     */
    changeDesignModeStep: function(gridName, step, dontManageGrid) {
        var grid = this.getGrid(gridName);

        if (typeof this.designModeValidSteps[step] == 'undefined') {
            throw new this.Exceptions.InvalidDesignModeStep("The given design mode step <" + step + "> is not a valid one");
        }

        var currentStep = this.getDesignModeStep(gridName);

        if (currentStep == step) {
            return;
        }

        if (!_.contains(this.designModeValidSteps[currentStep], step)) {
            throw new this.Exceptions.InvalidDesignModeStep("The given design mode step <" + step + "> is not valid step to go after the current one which is <" + currentStep + ">");
        }

        if (!dontManageGrid) {
            var gridHasPlaceholders = Manipulator.hasPlaceholders(grid);

            if (step == 'dragging' && !gridHasPlaceholders) {
                Manipulator.addPlaceholders(grid);
            } else if (step != 'dragging' && gridHasPlaceholders) {
                Manipulator.removePlaceholders(grid);
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
    setDesignModeStep: function(gridName, step) {
        var grid = this.getGridEntry(gridName);
        grid.designModeStep = step;
    },

    /**
     * Check that a gridName is valid, and if the node is given, if it belongs to this grid
     *
     * @param  {string} gridName - The grid name to check
     * @param  {XML} [node] - The node to check
     *
     * @throws {module:Grid.Store.Exceptions.GridDoesNotExist} If the given name does not match an existing grid name
     * @throws {module:Grid.Store.Exceptions.Inconsistency} If the given node does not belongs to the grid
     */
    checkConsistency: function(gridName, node) {
        var grid = this.getGrid(gridName);
        if (node && this.getMainGrid(node) != grid) {
            throw new this.Exceptions.Inconsistency("The given cell is not contained in the grid <" + gridName + ">");
        }
    },

    /**
     * Make a named backup of a grid.
     * The backup is a reference to the actual grid, and the actual grid is replaced by a clone
     *
     * @param  {string} gridName - The name of the grid to backup
     * @param  {string} backupName - The name of this backup. Should be "dragging" or "hovering"
     */
    backupGrid: function(gridName, backupName) {
        var actualGrid = this.grids[gridName].grid;
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
    restoreGrid: function(gridName, backupName) {
        var backup = this.grids[gridName].backups[backupName];
        if (backup) {
            this.grids[gridName].grid = backup;
            this.clearBackupedGrid(gridName, backupName);
            return this.grids[gridName].grid
        }
    },

    /**
     * Clear a named backup of a grid. Doesn't fail if the backup doesn't exist
     *
     * @param  {string} gridName - The name of the grid for which we want to clear its backup
     * @param  {string} backupName - The name of the backup we want to clear
     */
    clearBackupedGrid: function(gridName, backupName) {
        try {
            delete this.grids[gridName].backups[backupName];
        } catch(e) {};
    },

    /**
     * Save the reference of a grid node, with a specific name
     *
     * @param  {string} gridName - The name of the grid for which we want to save a node
     * @param  {XML} node - The XML grid node we want to save a reference for
     * @param  {string} saveName - The name of the saving node, for later reference
     */
    saveNode: function(gridName, node, saveName) {
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
    getSameNodeInActualGrid: function(gridName, node) {
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
    getSavedNode: function(gridName, saveName, dontUpdate) {
        // get the reference actually saved
        var oldNode = this.grids[gridName].nodes[saveName];
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
        var newNode = this.getSameNodeInActualGrid(gridName, oldNode);
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
    clearSavedNode: function(gridName, saveName) {
        try {
            delete this.grids[gridName].nodes[saveName];
        } catch(e) {};
    },

    /**
     * Set the timeout to enter the "stay hovering" mode
     *
     * @param {string} gridName - The grid we work with
     */
    setHoveringTimeout: function(gridName) {
        this.clearHoveringTimeout(gridName);
        this.getGridEntry(gridName).hoveringTimeout = setTimeout(_.bind(function() {
            this.stayHovering(gridName);
        }, this), this.hoveringDelay);
    },

    /**
     * Clear the timeout to enter the "stay hovering" mode
     *
     * @param {string} gridName - The grid we work with
     */
    clearHoveringTimeout: function(gridName) {
        var timeout = this.getGridEntry(gridName).hoveringTimeout;
        if (timeout) {
            clearTimeout(timeout);
            this.getGridEntry(gridName).hoveringTimeout = null;
        }
    },


    /**
     * Start dragging the given module in the given grid.
     * It's an action, should be called via
     * {@link module:Grid.Actions.startDragging Grid.Actions.startDragging}
     */
    startDragging: function(gridName, moduleCell) {
        this.checkConsistency(gridName, moduleCell);

        // make a backup copy of the grid without placeholders
        this.backupGrid(gridName, 'dragging');

        // use cell from the new grid
        moduleCell = this.getSameNodeInActualGrid(gridName, moduleCell);

        // remove the cell from the grid
        var contentNode = moduleCell.querySelector(':scope > content');
        Manipulator.removeContentNode(contentNode);

        // save the cell as the dragging one for this grid
        this.saveNode(gridName, contentNode, 'dragging');

        // set design step do "dragging"
        this.changeDesignModeStep(gridName, 'dragging');

        // emit events
        this.emit('grid.designMode.dragging.start', gridName);
    },

    /**
     * Stop dragging the currently dragged module in the given grid.
     * It's an action, should be called via
     * {@link module:Grid.Actions.cancelDragging Grid.Actions.cancelDragging}
     */
    cancelDragging: function(gridName) {
        this.checkConsistency(gridName);

        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // set design step to "enabled" (don't manage the grid as we'll restore the it below)
        this.changeDesignModeStep(gridName, 'enabled', true);

        // restore the "dragging" grid backup
        this.restoreGrid(gridName, 'dragging');

        // emit events
        this.emit('grid.designMode.dragging.stop', gridName);

        // we don't need to keep a reference to the dragging module
        this.clearSavedNode(gridName, 'dragging');

        // clear "hovering" backup if exists
        this.clearBackupedGrid(gridName, 'hovering');
    },

    /**
     * The currently dragged module stays on a placeholder.
     * It's an action, should be called via
     * {@link module:Grid.Actions.startHovering Grid.Actions.startHovering}
     */
    startHovering: function(gridName, placeholderCell) {
        this.checkConsistency(gridName, placeholderCell);

        // save the cell as the hovering one for this grid
        this.saveNode(gridName, placeholderCell, 'hovering');

        // Do not activate the rendering now
        this.setHoveringTimeout(gridName);

        // set design step to "prehovering"
        this.changeDesignModeStep(gridName, 'prehovering', true);

        // emit events
        this.emit('grid.designMode.hovering.start', gridName);
    },

    /**
     * The currently dragged module is hovering a placeholder for a certain delay
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid on witch the hovering occurs
     *
     * @fires module:Grid.Store#"grid.designMode.hovering.stay"
     */
    stayHovering: function(gridName) {
        this.checkConsistency(gridName);

        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // make a backup copy of the grid with placeholders
        this.backupGrid(gridName, 'hovering');

        // use placeholder from the new grid
        var placeholderCell = this.getSavedNode(gridName, 'hovering');

        // attach the dragged module to the placeholder
        var draggedContent = this.getSavedNode(gridName, 'dragging', true);
        Manipulator.moveContentToPlaceholder(draggedContent, placeholderCell);

        // save the cell as the hovering one for this grid
        this.saveNode(gridName, placeholderCell, 'hovering');

        // set design step to "hovering"
        this.changeDesignModeStep(gridName, 'hovering');

        // emit events
        this.emit('grid.designMode.hovering.stay', gridName);
    },

    /**
     * The currently dragged module moves away from the placeholder it was hover.
     * It's an action, should be called via
     * {@link module:Grid.Actions.stopHovering Grid.Actions.stopHovering}
     */
    stopHovering: function(gridName) {
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

        // emit events
        this.emit('grid.designMode.hovering.stop', gridName);
    },

    /**
     * Drop the currently dragged module in the given placeholder.
     * It's an action, should be called via
     * {@link module:Grid.Actions.drop Grid.Actions.drop}
     */
    drop: function(gridName) {
        this.checkConsistency(gridName);

        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // attach the dragged module to the placeholder if we were in dragging mode
        // it happens it the drop came before the stay-hoveringTimeout
        if (this.getDesignModeStep(gridName) == 'prehovering') {
            var draggedContent = this.getSavedNode(gridName, 'dragging', true);
            var placeholderCell = this.getSavedNode(gridName, 'hovering');
            Manipulator.moveContentToPlaceholder(draggedContent, placeholderCell);
        }

        // set design step to "enabled"
        this.changeDesignModeStep(gridName, 'enabled');

        // emit events
        this.emit('grid.designMode.drop', gridName);

        // clear backups if exists
        this.clearBackupedGrid(gridName, 'dragging');
        this.clearBackupedGrid(gridName, 'hovering');
        this.clearSavedNode(gridName, 'dragging');
        this.clearSavedNode(gridName, 'hovering');
    },

    // add the public interface
    exports: Store,

};

// hidden ref to private interface from the store, to access in tests
Private.exports.__private = Private;


// Exceptions must be based on the Error class
_(Store.Exceptions).forEach(function(exceptionClass, exceptionName) {
    exceptionClass.prototype = new Error();
    exceptionClass.prototype.constructor = exceptionClass;
    exceptionClass.displayName = exceptionName;
});


Store = flux.createStore(Private);

// exceptions must be accessible via the private api too
Private.Exceptions = Store.Exceptions;

module.exports = Store;
