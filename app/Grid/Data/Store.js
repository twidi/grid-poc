import _ from 'lodash';
import flux from 'flux-react';

import { Exceptions } from '../../Utils';

import { Actions } from './Actions';
import { Manipulator } from './Manipulator';


/**
 * The Grid store. This is the public interface
 * @memberOf module:Grid.Data
 * @class

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
         * @param {String} [message=Grid does not exist] - The raised message
         *
         * @property {String} name - The name of the exception: "GridDoesNotExist"
         * @property {String} message - The message passed when the exception was raised, or a default value
         */
        GridDoesNotExist(message) {
            this.name = 'GridDoesNotExist';
            this.message = message || 'Grid does not exist';
        },
        /**
         * Exception raised when a node does not exist
         * This is a subclass of "Error"
         * @class
         *
         * @param {String} [message=Node does not exist] - The raised message
         *
         * @property {String} name - The name of the exception: "NodeDoesNotExist"
         * @property {String} message - The message passed when the exception was raised, or a default value
         */
        NodeDoesNotExist(message) {
            this.name = 'NodeDoesNotExist';
            this.message = message || 'Node does not exist';
        },
        /**
         * Exception raised when a design mode step is not valid
         * This is a subclass of "Error"
         * @class
         *
         * @param {String} [message=Design mode step is invalid] - The raised message
         *
         * @property {String} name - The name of the exception: "InvalidDesignModeStep"
         * @property {String} message - The message passed when the exception was raised, or a default value
         */
        InvalidDesignModeStep(message) {
            this.name = 'InvalidDesignModeStep';
            this.message = message || 'Design mode step is invalid';
        },

        /**
         * Exception raised when an inconsistency occurs
         * This is a subclass of "Error"
         * @class
         *
         * @param {String} [message=Inconsistency detected] - The raised message
         *
         * @property {String} name - The name of the exception: "Inconsistency"
         * @property {String} message - The message passed when the exception was raised, or a default value
         */
        Inconsistency(message) {
            this.name = 'Inconsistency';
            this.message = message || 'Inconsistency detected';
        },

        /**
         * Exception raised when an history manipulation cannot be done because it's out of bound.
         * This is a subclass of "Error"
         * @class
         *
         * @param {String} [message=Operation out of bound on history] - The raised message
         *
         * @property {String} name - The name of the exception: "HistoryOutOfBound"
         * @property {String} message - The message passed when the exception was raised, or a default value
         */
        HistoryOutOfBound(message) {
            this.name = 'HistoryOutOfBound';
            this.message = message || 'Operation out of bound on history';
        }
    },

    /**
     * Get a grid from the store by its name. All nodes are ensured to have an ID.
     * And module cells an index.
     *
     * @param  {String} gridName - Name of the grid to get
     *
     * @return {Element|Node|XML} - The wanted XML grid
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
     * @param  {String} gridName - Name of the grid to get
     * @param  {String} nodeId - Id of the grid node to get
     *
     * @return {Element|Node|XML} - The wanted XML node
     *
     * @throws {module:Grid.Data.Store.Exceptions.GridDoesNotExist}
     *     If the given name does not match an existing grid name
     * @throws {module:Grid.Data.Store.Exceptions.NodeDoesNotExist}
     *     If the given id does not match an existing node id
     */
    getGridNodeById(gridName, nodeId) {
        const grid = this.getGrid(gridName);
        if (grid.getAttribute('id') === nodeId) {
            return grid;
        }
        const node = grid.querySelector(`#${nodeId}`);
        if (!node) {
            throw new this.Exceptions.NodeDoesNotExist(`No node with the ID <${nodeId}>`);
        }
        return node;
    },

    /**
     * Return the id attribute of the given node
     *
     * @param  {Element|Node|XML} node - The XML node for which we want the id
     *
     * @return {String} - The id attribute of the node
     */
    getNodeId(node) {
        return node.getAttribute('id');
    },

    /**
     * Return the main grid for the given node
     *
     * @param  {Element|Node|XML} node - The XML node for which we want the grid
     *
     * @return {Element|Node|XML} - The main grid of the node
     */
    getMainGrid(node) {
        return node.ownerDocument.documentElement;
    },

    /**
     * Return the name of the main grid
     *
     * @param  {Element|Node|XML} node - The XML node for which we want the grid
     *
     * @return {String} - The name of the main grid
     */
    getMainGridName(node) {
        return this.getMainGrid(node).getAttribute('name');
    },

    /**
     * Get the design mode step for a grid from the store by its name.
     *
     * @param  {String} gridName - Name of the grid for which we want the design mode step
     *
     * @return {String} - The current design mode step of the grid
     */
    getDesignModeStep(gridName) {
        const grid = this.getGridEntry(gridName);
        return grid.designModeStep;
    },

    /**
     * Tell if the given grid is in dragging mode (a module cell is currently dragged by the user)
     *
     * @param  {String} gridName - Name of the grid for which we want to know if it is in dragging mode
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
     * @param  {String} gridName - Name of the grid for which we want to do the check
     * @param  {Element|Node|XML}  cell - The cell we want to check if it's the currently dragged one
     *
     * @return {Boolean} - `true` if the cell is the currently dragged one,or `false`
     */
    isDraggingCell(gridName, cell) {
        const draggingNode = this.grids[gridName].nodes.dragging;
        if (!draggingNode) { return false; }
        return draggingNode.getAttribute('id') === cell.querySelector(':scope > content').getAttribute('id');
    },

    /**
     * Tell if the given grid is in hovering mode (a module cell is currently hover a placeholder)
     *
     * @param  {String} gridName - Name of the grid for which we want to know if it is in hovering mode
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
     * @param  {String} gridName - Name of the grid for which we want to do the check
     * @param  {Element|Node|XML}  placeholder - The placeholder we want to check if it's the currently hovered one
     *
     * @return {Boolean} - `true` if the placeholder is the currently hovered one,or `false`
     */
    isHoveringPlaceholder(gridName, placeholder) {
        const hoveringNode = this.grids[gridName].nodes.hovering;
        if (!hoveringNode) { return false; }
        return hoveringNode.getAttribute('id') === placeholder.getAttribute('id');
    },

    /**
     * Tell if the given grid is in resizing mode (a resizing node is currently dragged by the user)
     *
     * @param  {String} gridName - Name of the grid for which we want to know if it is in resizing mode
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
     * @param  {String} gridName - Name of the grid for which we want to do the check
     * @param  {Element|Node|XML}  resizer - The resizer we want to check if it's the currently dragged one
     *
     * @return {Boolean} - `true` if the resizer is the currently dragged one,or `false`
     */
    isMovingResizer(gridName, resizer) {
        const resizingNode = this.grids[gridName].nodes.resizing;
        if (!resizingNode) { return false; }
        return resizingNode.getAttribute('id') === resizer.getAttribute('id');
    },

    /**
     * Tell if the given node contains a subgrid.
     *
     * @param  {Element|Node|XML} node - The XML node to check for sub grids
     *
     * @return {Boolean} - `true` if the node contains at least one subgrid, or `false`
     */
    containsSubGrid(node) {
        return Manipulator.containsSubGrid(node);
    },

    /**
     * Tell if the grid has placeholders
     *
     * @param  {String} gridName - Name of the grid for which we want to know if it has placeholders
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
     * @param  {String} gridName - Name of the grid for which we want to know if it has resizers
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
     * @param  {Element|Node|XML} node - The node for which we want the size
     *
     * @return {Number} - The float-converted value of the attribute, or 1 if not defined
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
     * Tell if the given module cell is the currently focused one
     *
     * @param  {String} gridName - The name of the grid for which we ask
     * @param  {Element|Node|XML} moduleCell - The module cell to ask if it is focused
     *
     * @return {Boolean} - `true` if it's the focused cell, or `false`
     */
    isFocusedModuleCell(gridName, moduleCell) {
        return moduleCell.getAttribute('id') === this.getGridEntry(gridName).focusedModuleCellId;
    },

    /**
     * Return the index of the currently focused module cell
     *
     * @param  {String} gridName - The name of the grid for which we ask
     *
     * @returns {int} - The index of the currently focused module cell. 0 if any problem.
     */
    getFocusedModuleCellIndex(gridName) {
        const gridEntry = this.getGridEntry(gridName);
        const focusedModuleId = gridEntry.focusedModuleCellId;
        if (focusedModuleId) {
            try {
                return parseInt(this.getGridNodeById(gridName, focusedModuleId).getAttribute('module-index') || 0, 10);
            } catch (e) {
                return 0;
            }
        }
        return 0;
    },

    /**
     * Get the one-screen mode step for a grid from the store by its name.
     *
     * @param  {String} gridName - Name of the grid for which we want the one-screen step
     *
     * @return {bool} - The current one-screen step of the grid
     */
    isOneScreenMode(gridName) {
        const grid = this.getGridEntry(gridName);
        return grid.oneScreenMode;
    },

    /**
     * Remove all the grids
     *
     * @private
     */
    __removeAllGrids() {
        _.forOwn(this.grids, (grid, gridName) => {
            delete this.grids[gridName];
        });
    }
};


/**
 * Private interface of the Store module. Everything can only be accessed inside the Store itself
 * @memberOf module:Grid.Data.Store
 * @inner
 * @class
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
     * @property {String} name - The name of the grid
     * @property {Element|Node|XML} grid - The XML grid
     * @property {String} designModeStep - The current design mode step for this grid
     * @property {String} focusedModuleCellId - The ID of the actual focused cell
     * @property {bool} oneScreenMode - If the grid is currently in one-screen-only mode
     *
     * @property {Array} history - History of grids to allow undo/redo
     * @property {int} currentHistoryIndex - The current index in history
     *
     * @property {Object} backups - Some backups of previous states needed during the drag and drop process
     * @property {Object} backups.dragging - The grid before starting the dragging process
     * @property {Object} backups.hovering - The grid after starting the dragging process,
     *                                       before hovering on a placeholder
     *
     * @property {Object} nodes - References to some node that are manipulated through the drag and drop process
     * @property {Object} nodes.dragging - The node currently being dragged
     * @property {Object} nodes.hovering - The placeholder node currently being hovered by the dragged node
     * @property {Object} nodes.resizing - The resizer node currently being moved
     *
     * @property {timeout} hoveringTimeout - The timeout to take hovering into account
     *
     * @property {Object} resizing - Some data to hold current state of resizing
     * @property {int} resizing.initialPos - Initial position of the mouse when the resizing started
     *                                           (X if vertical resizer, Y if horizontal)
     * @property {float} resizing.previousRelativeSize - The initial related size of the previous node
     * @property {float} resizing.nextRelativeSize - The initial related size of the next node
     * @property {float} resizing.sizeRatio - The ratio to use to compute new relative size.,
     *                                        based on `fullSize` given when resizing started,
     *                                        and the full relative size
     */
    grids: {},

    /**
     * All valid design mode steps as keys, and accepted next step as values (array)
     * @type {Object}
     * @readonly
     *
     * @property {String} disabled
     * The design mode is not activated.
     *
     * It can go to:
     * - `enabled` if the design mode is activated.
     *
     * @property {String} enabled
     * The design mode is activated, waiting for dragging to start.
     *
     * It can go to
     * - `disabled` if the design mode is deactivated.
     * - `dragging` if a module starts being dragged.
     * - `resizing` if a resizing handler is being moved
     *
     * @property {String} resizing
     * The resizing has started.
     *
     * It can go to:
     * - `enabled` if the resizing has stopped
     *
     * @property {String} dragging
     * The dragging has started, waiting for hovering.
     *
     * It can go to:
     * - `enabled` if a module stops being dragged
     * - `prehovering` if the module enter a placeholder
     *
     * @property {String} prehovering
     * The dragged module is hover a placeholder, for a short time
     *
     * It can go to:
     * - `dragging` if the module exit the placeholder
     * - `hovering` if the module stays a little longer on the placeholder
     * - `enabled` if the dragged module is dropped.
     *
     * @property {String} hovering
     * The dragged element is hover a placeholder.
     *
     * It can go to:
     * - `dragging` if the dragged module moves again.
     * - `enabled` if the dragged module is dropped.
     *
     */
    designModeValidSteps: {
        disabled: ['enabled'],
        enabled: ['disabled', 'dragging', 'resizing'],
        resizing: ['enabled'],
        dragging: ['enabled', 'prehovering'],
        prehovering: ['dragging', 'hovering', 'enabled'],
        hovering: ['dragging', 'enabled']
    },


    actions: _.values(Actions),


    /**
     * Get a grid and its associated data from the store by its name.
     *
     * @param  {String} gridName - Name of the grid to get
     *
     * @return {Object}
     *
     * An object containing:
     *
     * - `grid`: the XML grid
     * - `designModeStep`: the current design mode step for the grid
     *
     * @throws {module:Grid.Data.Store.Exceptions.GridDoesNotExist}
     *     If the given name does not match an existing grid name
     */
    getGridEntry(gridName) {
        if (!_.has(this.grids, gridName)) {
            throw new this.Exceptions.GridDoesNotExist(`No grid with the name <${gridName}>`);
        }
        return this.grids[gridName];
    },

    /**
     * Add a grid to the list of grids.
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.addGrid Actions.addGrid}
     *
     * @param {Element|Node|XML} grid - The grid to add to the list
     *
     * @fires module:Grid.Data.Store#"grid.add"
     */
    addGrid(grid) {
        const name = grid.getAttribute('name');
        if (_.has(this.grids, name)) {
            throw new this.Exceptions.GridDoesNotExist(`There is already a grid the name <${name}>`);
        }
        this.grids[name] = {
            name,
            grid,
            designModeStep: 'disabled',
            oneScreenMode: false,
            focusedModuleCellId: null,
            history: [],
            currentHistoryIndex: -1.0,
            backups: {},
            nodes: {},
            hoveringTimeout: null,
            resizing: {}
        };

        // starting point of this grid history
        this.addCurrentGridToHistory(name);

        /**
         * Event fired when a grid is added to the Grid store
         *
         * @event module:Grid.Data.Store#"grid.add"
         *
         * @property {String} name - The name of the added Grid
         */
        this.emit('grid.add', name);
    },

    /**
     * Add a module to the given grid after the current focused cell (default to after the first one)
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.addModule Actions.addModule}
     *
     * @param {String} gridName - The name of the grid on which to add the module
     * @param {String} module - The path of the module to use
     * @param {Object} params - An flat object with all attributes of this module
     *
     * @fires module:Grid.Data.Store#"grid.designMode.module.add"
     */
    addModule(gridName, module, params) {
        const grid = this.getGrid(gridName);

        const hasResizers = Manipulator.hasResizers(grid);

        // remove resizers for now
        if (hasResizers) {
            Manipulator.removeResizers(grid);
        }

        // create a content node, including the module name as an attribute
        const attributes = _.extend({ component: module }, params);
        const contentNode = Manipulator.createContentNode(grid, attributes);

        const currentCell = this.getFocusedModuleCell(gridName) || grid.querySelector('cell');
        let row;
        let beforeCell = null;
        if (currentCell) {
            // get the row of the cell
            row = currentCell.parentNode;
            beforeCell = currentCell.nextSibling;
            if (!beforeCell
                ||
                beforeCell.nodeName !== 'cell'
                ||
                beforeCell.getAttribute('type') !== 'module'
            ) { beforeCell = null; }
        } else {
            // add a row with this module only
            const firstRow = grid.querySelector('row');
            row = Manipulator.addRow(grid, firstRow);
        }

        const newCell = Manipulator.addCell(row, beforeCell, 'module', contentNode);

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
         * @event module:Grid.Data.Store#"grid.designMode.module.add"
         *
         * @property {String} name - The name of the updated Grid
         */
        this.emit('grid.designMode.module.add', gridName, newCell.getAttribute('id'));
    },

    /**
     * Remove a module from the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.removeModule Actions.removeModule}
     *
     * @param  {String} gridName - The grid from which we want to remove the module
     * @param  {Element|Node|XML} moduleCell - The module cell to remove
     *
     * @fires module:Grid.Data.Store#"grid.designMode.module.remove"
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

        Manipulator.setIds(grid);

        // grid changed, add it to history
        this.addCurrentGridToHistory(gridName);

        /**
         * Event fired when a module is removed from a grid
         *
         * @event module:Grid.Data.Store#"grid.designMode.module.remove"
         *
         * @property {String} name - The name of the updated Grid
         */
        this.emit('grid.designMode.module.remove', gridName);
    },

    /**
     * Set design mode for the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.enterDesignMode Actions.enterDesignMode}
     *
     * @param {String} gridName - The name of the grid for witch we want to enter the design mode
     *
     * @fires module:Grid.Data.Store#"grid.designMode.enter"
     */
    enterDesignMode(gridName) {
        this.changeDesignModeStep(gridName, 'enabled');

        /**
         * Event fired when a grid enters design mode
         *
         * @event module:Grid.Data.Store#"grid.designMode.enter"
         *
         * @property {String} gridName - The name of the updated grid
         */
        this.emit('grid.designMode.enter', gridName);
    },

    /**
     * Exit design mode for the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.exitDesignMode Actions.exitDesignMode}
     *
     * @param {String} gridName - The name of the grid for witch we want to exit the design mode
     *
     * @fires module:Grid.Data.Store#"grid.designMode.exit"
     */
    exitDesignMode(gridName) {
        this.changeDesignModeStep(gridName, 'disabled');

        /**
         * Event fired when a grid exits design mode
         *
         * @event module:Grid.Data.Store#"grid.designMode.exit"
         *
         * @property {String} gridName - The name of the updated grid
         */
        this.emit('grid.designMode.exit', gridName);
    },

    /**
     * Set the design mode step for the given grid. Add/remove placeholders and resizers if needed
     *
     * @param {String} gridName - The XML grid for which we want to change de design mode step
     * @param {String} step - The new step ("disabled", "enabled", "dragging", "hovering")
     * @param {boolean} [dontManageGrid=false] - If `true`, won't add or remove placeholders/resizers,
     *                                           and won't manage grid ids
     */
    changeDesignModeStep(gridName, step, dontManageGrid) {
        const grid = this.getGrid(gridName);

        if (typeof this.designModeValidSteps[step] === 'undefined') {
            throw new this.Exceptions.InvalidDesignModeStep(`The given design mode step <${step}> is not a valid one`);
        }

        const currentStep = this.getDesignModeStep(gridName);

        if (currentStep === step) {
            return;
        }

        if (!_.includes(this.designModeValidSteps[currentStep], step)) {
            throw new this.Exceptions.InvalidDesignModeStep(
                `The given design mode step <${step}> is not valid step to go `
                + `after the current one which is <${currentStep}>`
            );
        }

        if (!dontManageGrid) {
            const gridHasPlaceholders = Manipulator.hasPlaceholders(grid);
            const gridHasResizers = Manipulator.hasResizers(grid);

            if (!(step === 'dragging' || step === 'prehovering') && gridHasPlaceholders) {
                Manipulator.removePlaceholders(grid);
            }
            if (!(step === 'enabled' || step === 'resizing') && gridHasResizers) {
                Manipulator.removeResizers(grid);
            }
            if ((step === 'dragging' || step === 'prehovering') && !gridHasPlaceholders) {
                Manipulator.addPlaceholders(grid);
            }
            if ((step === 'enabled' || step === 'resizing') && !gridHasResizers) {
                Manipulator.addResizers(grid);
            }

            Manipulator.setIds(grid);
        }

        this.setDesignModeStep(gridName, step);
    },

    /**
     * Set the design mode step for a grid from the store by its name.
     *
     * @param  {String} gridName - Name of the grid for which we want to set design mode step
     * @param {String} step - The new design mode step for the grid
     */
    setDesignModeStep(gridName, step) {
        const grid = this.getGridEntry(gridName);
        grid.designModeStep = step;
    },

    /**
     * Check that a gridName is valid, and if the node is given, if it belongs to this grid
     *
     * @param  {String} gridName - The grid name to check
     * @param  {Element|Node|XML} [node=] - The node to check
     *
     * @returns {Element|Node|XML} - The node, eventually updated to be the actual one in the grid
     *
     * @throws {module:Grid.Data.Store.Exceptions.GridDoesNotExist}
     *     If the given name does not match an existing grid name
     * @throws {module:Grid.Data.Store.Exceptions.Inconsistency}
     *     If the given node does not belongs to the grid
     */
    checkConsistency(gridName, node) {
        this.getGrid(gridName);
        if (node) {
            try {
                this.getSameNodeInActualGrid(gridName, node);
            } catch (e) {
                throw new this.Exceptions.Inconsistency(`The given cell is not contained in the grid <${gridName}>`);
            }
        }
        return node;
    },

    /**
     * Make a named backup of a grid.
     * The backup is a reference to the actual grid, and the actual grid is replaced by a clone
     *
     * @param  {String} gridName - The name of the grid to backup
     * @param  {String} backupName - The name of this backup. Should be "dragging" or "hovering"
     */
    backupGrid(gridName, backupName) {
        const actualGrid = this.grids[gridName].grid;
        this.grids[gridName].backups[backupName] = actualGrid;
        this.grids[gridName].grid = Manipulator.clone(actualGrid);
    },

    /**
     * Restore a named backup of a grid.
     * The backup will be removed and the actual grid will be lost
     *
     * @param  {String} gridName - The name of the grid for which we want to restore its backup
     * @param  {String} backupName - The name of the backup to restore
     *
     * @return {Element|Node|XML} - The backed-up grid now restored
     */
    restoreGrid(gridName, backupName) {
        const backup = this.grids[gridName].backups[backupName];
        if (backup) {
            this.grids[gridName].grid = backup;
            this.clearBackedUpGrid(gridName, backupName);
            return this.grids[gridName].grid;
        }
    },

    /**
     * Clear a named backup of a grid. Doesn't fail if the backup doesn't exist
     *
     * @param  {String} gridName - The name of the grid for which we want to clear its backup
     * @param  {String} backupName - The name of the backup we want to clear
     */
    clearBackedUpGrid(gridName, backupName) {
        try {
            delete this.grids[gridName].backups[backupName];
        } catch (e) {}
    },

    /**
     * Save the reference of a grid node, with a specific name
     *
     * @param  {String} gridName - The name of the grid for which we want to save a node
     * @param  {Element|Node|XML} node - The XML grid node we want to save a reference for
     * @param  {String} saveName - The name of the saving node, for later reference
     */
    saveNode(gridName, node, saveName) {
        this.grids[gridName].nodes[saveName] = node;
    },

    /**
     * Return a node in a grid, searching by the ID of the given node.
     * It may not be the same node if the grid was backed-up
     *
     * @param  {String} gridName - The grid in which to search for the given node
     * @param  {Element|Node|XML} node - The node we want to find in the grid, using its ID
     *
     * @return {Element|Node|XML} - The wanted node from the actual grid
     */
    getSameNodeInActualGrid(gridName, node) {
        return this.getGridNodeById(gridName, node.getAttribute('id'));
    },

    /**
     * Get a previously saved reference to a grid node.
     * Ensure that the node returned is in the actual grid and not in a backup, except if dontUpdate is true
     *
     * @param  {String} gridName - The name of the grid for which we want the reference node
     * @param  {String} saveName - The name used in `saveNode` to get the reference back
     * @param  {boolean} [dontUpdate=false] - Do not try to find the node in the actual grid
     *                                        (if the node was removed for example)
     *
     * @return {Element|Node|XML} - The wanted node grid (or null if not found)
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
        // backed-up for example)
        const newNode = this.getSameNodeInActualGrid(gridName, oldNode);
        // save the new node
        this.saveNode(gridName, newNode, saveName);
        // return the node in the actual grid
        return newNode;
    },

    /**
     * Clear a named reference to a grid node. Doesn't fail if the reference doesn't exist
     * @param  {String} gridName - The name of the grid for which we want to clear the reference
     * @param  {String} saveName - The name of the used in `saveNode` of the reference to clear
     */
    clearSavedNode(gridName, saveName) {
        try {
            delete this.grids[gridName].nodes[saveName];
        } catch (e) {}
    },

    /**
     * Set the timeout to enter the "stay hovering" mode
     *
     * @param {String} gridName - The grid we work with
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
     * @param {String} gridName - The grid we work with
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
     * {@link module:Grid.Data.Actions.startDragging Actions.startDragging}
     *
     * @param {String} gridName - The name of the grid for witch we want to stop dragging
     * @param  {Element|Node|XML} moduleCell - The module cell to drag
     *
     * @fires module:Grid.Data.Store#"grid.designMode.dragging.start"
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
             * @event module:Grid.Data.Store#"grid.designMode.dragging.start"
             *
             * @property {String} name - The name of the Grid where the dragging occurs
             */
            this.emit('grid.designMode.dragging.start', gridName);

        } catch (e) {
            // we had an error, restore to the previous state
            this.restoreGrid(gridName, 'dragging');
            this.clearSavedNode(gridName, 'dragging');
            if (this.getDesignModeStep(gridName) === 'dragging') {
                this.changeDesignModeStep(gridName, 'enabled');
            }
        }
    },

    /**
     * Stop dragging the currently dragged module in the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.cancelDragging Actions.cancelDragging}
     *
     * @param {String} gridName - The name of the grid for witch we want to stop dragging
     *
     * @fires module:Grid.Data.Store#"grid.designMode.dragging.stop"
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
         * @event module:Grid.Data.Store#"grid.designMode.dragging.stop"
         *
         * @property {String} name - The name of the Grid where the dragging occurs
         */
        this.emit('grid.designMode.dragging.stop', gridName);

        // we don't need to keep a reference to the dragging module
        this.clearSavedNode(gridName, 'dragging');

        // clear "hovering" backup if exists
        this.clearBackedUpGrid(gridName, 'hovering');
    },

    /**
     * The currently dragged module stays on a placeholder.
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.startHovering Actions.startHovering}
     *
     * @param {String} gridName - The name of the grid on witch the hovering occurs
     * @param {Element|Node|XML} [placeholderCell=] - The "placeholder" cell where we the module is hover
     *
     * @fires module:Grid.Data.Store#"grid.designMode.hovering.start"
     */
    startHovering(gridName, placeholderCell) {
        placeholderCell = this.checkConsistency(gridName, placeholderCell);

        if (!placeholderCell) { return; }

        const currentHovering = this.getSavedNode(gridName, 'hovering');

        // we already have an hovering cell...
        if (currentHovering) {
            // do nothing if existing hovering is the same
            if (currentHovering === placeholderCell
                    || currentHovering.getAttribute('id') === placeholderCell.getAttribute('id')) {
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
         * @event module:Grid.Data.Store#"grid.designMode.hovering.start"
         *
         * @property {String} name - The name of the Grid where the dragging occurs
         */
        this.emit('grid.designMode.hovering.start', gridName);
    },

    /**
     * The currently dragged module is hovering a placeholder for a certain delay
     *
     * @param {String} gridName - The name of the grid on witch the hovering occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.hovering.stay"
     */
    stayHovering(gridName) {
        this.checkConsistency(gridName);

        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // stop if we're not in pre-hovering mode (the timeout should have been killed, but...)
        if (this.getDesignModeStep(gridName) !== 'prehovering') {
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
         * @event module:Grid.Data.Store#"grid.designMode.hovering.stay"
         *
         * @property {String} name - The name of the Grid where the dragging occurs
         */
        this.emit('grid.designMode.hovering.stay', gridName);
    },

    /**
     * The currently dragged module moves away from the placeholder it was hover.
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.stopHovering Actions.stopHovering}
     *
     * @param {String} gridName - The name of the grid on witch the hovering occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.hovering.stop"
     */
    stopHovering(gridName) {
        this.checkConsistency(gridName);

        // stop the delay to go in real hovering mode
        this.clearHoveringTimeout(gridName);

        // if we were in hovering mode (hover for a "long" time), restore the "hovering" grid backup
        if (this.getDesignModeStep(gridName) === 'hovering') {
            this.restoreGrid(gridName, 'hovering');
        }

        // set design step to "dragging" (don't manage the grid as it was restored above)
        this.changeDesignModeStep(gridName, 'dragging', true);

        // we don't need to keep a reference to the hovered module
        this.clearSavedNode(gridName, 'hovering');

        /**
         * Event fired when a dragged module stops hovering a placeholder
         *
         * @event module:Grid.Data.Store#"grid.designMode.hovering.stop"
         *
         * @property {String} name - The name of the Grid where the dragging occurs
         */
        this.emit('grid.designMode.hovering.stop', gridName);
    },

    /**
     * Drop the currently dragged module in the given placeholder.
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.drop Actions.drop}
     *
     * @param {String} gridName - The name of the grid for witch we want to start dragging
     * @param {Element|Node|XML} [placeholderCell=] - The "placeholder" cell where we want to drag the cell
     * to be dropped on. If defined, will replace the one saved in the store.
     *
     * @fires module:Grid.Data.Store#"grid.designMode.drop"
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
        if (placeholderCell && placeholderCell !== existingPlaceholderCell) {
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
        if (designModeStep === 'dragging') {
            this.cancelDragging(gridName);
            // should not be needed, but just in case, we are not sure in which order events will come
            this.clearBackedUpGrid(gridName, 'hovering');
            this.clearSavedNode(gridName, 'hovering');
            return;
        }

        // attach the dragged module to the placeholder if we were in dragging mode
        // it happens it the drop came before the stay-hoveringTimeout
        if (designModeStep === 'prehovering') {
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
         * @event module:Grid.Data.Store#"grid.designMode.drop"
         *
         * @property {String} name - The name of the Grid where the dragging occurs
         */
        this.emit('grid.designMode.drop', gridName);

        // clear backups if exists
        this.clearBackedUpGrid(gridName, 'dragging');
        this.clearBackedUpGrid(gridName, 'hovering');
        this.clearSavedNode(gridName, 'dragging');
        this.clearSavedNode(gridName, 'hovering');
    },

    /**
     * Start moving the given resizer on the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.startResizing Actions.startResizing}
     *
     * @param  {String} gridName - The name of the grid on witch the resizing occurs
     * @param  {Element|Node|XML} resizer - The resizer of the grid being moved
     * @param  {int} fullSize - The full size (height if horizontal resizer, else width)
     *                              of the previous and next nodes
     * @param  {int} initialPos - The position of the mouse acting as a starting point for the resizing
     *
     * @fires module:Grid.Data.Store#"grid.designMode.resizing.start"
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
            initialPos,
            previousRelativeSize,
            nextRelativeSize,
            sizeRatio: (previousRelativeSize + nextRelativeSize) / fullSize
        };

        // set design step to "resizing"
        this.changeDesignModeStep(gridName, 'resizing');

        /**
         * Event fired when a resizer starts to be moved
         *
         * @event module:Grid.Data.Store#"grid.designMode.resizing.start"
         *
         * @property {String} name - The name of the Grid where the resizing occurs
         */
        this.emit('grid.designMode.resizing.start', gridName);
    },

    /**
     * Move a resizer to resize its previous and next nodes
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.resize Actions.resize}
     *
     * @param  {String} gridName - The name of the grid on witch the resizing occurs
     * @param  {int} currentPos - The position of the mouse at the moment where the action is called
     *                                to compute the new sizes of the previous and next nodes
     *
     * @fires module:Grid.Data.Store#"grid.designMode.resizing.move"
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
            nextRelativeSize: newNextRelativeSize
        };

        /**
         * Event fired when a resizer is moved over the grid
         *
         * @event module:Grid.Data.Store#"grid.designMode.resizing.move"
         *
         * @property {String} name - The name of the Grid where the resizing occurs
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
     * {@link module:Grid.Data.Actions.stopResizing Actions.stopResizing}
     *
     * @param  {String} gridName - The name of the grid on witch the resizing occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.resizing.stop"
     */
    stopResizing(gridName) {
        this.checkConsistency(gridName);

        // set design step to "enabled"
        this.changeDesignModeStep(gridName, 'enabled');

        /**
         * Event fired when a resizer is released
         *
         * @event module:Grid.Data.Store#"grid.designMode.resizing.stop"
         *
         * @property {String} name - The name of the Grid where the resizing occurs
         */
        this.emit('grid.designMode.resizing.stop', gridName);

        // add the grid in history if it really changed
        const resizer = this.getSavedNode(gridName, 'resizing');
        if (!resizer) return;
        const currentPreviousRelativeSize = this.getRelativeSize(resizer.previousSibling);
        const currentNextRelativeSize = this.getRelativeSize(resizer.nextSibling);
        const resizing = this.getGridEntry(gridName).resizing;
        if (
            resizing.previousRelativeSize !== currentPreviousRelativeSize
            ||
            resizing.nextRelativeSize !== currentNextRelativeSize
        ) {
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
         * @event module:Grid.Data.Store#"grid.designMode.history.add"
         *
         * @property {String} name - The name of the Grid where the history was changed
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
     * {@link module:Grid.Data.Actions.goBackInHistory Actions.goBackInHistory}
     *
     * @param  {String} gridName - The name of the grid on witch the undo occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.history.back"
     */
    goBackInHistory(gridName) {
        if (!this.canGoBackInHistory(gridName)) {
            throw new this.Exceptions.HistoryOutOfBound(`Cannot go backward in history for grid <${gridName}>`);
        }

        const gridEntry = this.getGridEntry(gridName);
        gridEntry.currentHistoryIndex--;

        this.restoreFromCurrentHistoryIndex(gridName);

        /**
         * Event fired when we go back to the previous version of a grid in its history
         *
         * @event module:Grid.Data.Store#"grid.designMode.history.back"
         *
         * @property {String} name - The name of the Grid where the history was changed
         */
        this.emit('grid.designMode.history.back', gridName);
    },

    /**
     * Use the next version of grid found in its history
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.goForwardInHistory Actions.goForwardInHistory}
     *
     * @param  {String} gridName - The name of the grid on witch the redo occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.history.forward"
     */
    goForwardInHistory(gridName) {
        if (!this.canGoForwardInHistory(gridName)) {
            throw new this.Exceptions.HistoryOutOfBound(`Cannot go forward in history for grid <${gridName}>`);
        }

        const gridEntry = this.getGridEntry(gridName);
        gridEntry.currentHistoryIndex++;

        this.restoreFromCurrentHistoryIndex(gridName);

        /**
         * Event fired when we go forward to the next version of a grid in its history
         *
         * @event module:Grid.Data.Store#"grid.designMode.history.forward"
         *
         * @property {String} name - The name of the Grid where the history was changed
         */
        this.emit('grid.designMode.history.forward', gridName);
    },

    /**
     * Return the currently focused module cell for the given grid
     *
     * @param  {String} gridName - The name of the grid for which we want the focused cell
     *
     * @return {Element|Node|undefined} - The grid xml node actually focused, or nothing if no focused cell
     */
    getFocusedModuleCell(gridName) {
        const gridEntry = this.getGridEntry(gridName);
        if (!gridEntry.focusedModuleCellId) { return; }
        return gridEntry.grid.querySelector(`#${gridEntry.focusedModuleCellId}`);
    },

    /**
     * Focus the given module cell in the given grid. If not possible, focus
     * the first available module cell if asked
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.focusModuleCell Actions.focusModuleCell}
     *
     * @param  {String} gridName - The name of the grid for which we want to focus a cell
     * @param  {Element|Node|XML} [moduleCell=] - The module cell we want to set the focus on
     * @param  {Boolean} [defaultToFirstModuleCell=false]
     *         - `true` if we want to focus the first available cell if the given one is not available
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusModuleCell(gridName, moduleCell, defaultToFirstModuleCell) {
        const gridEntry = this.getGridEntry(gridName);
        const oldFocusedModuleCellId = gridEntry.focusedModuleCellId;
        if (!moduleCell && defaultToFirstModuleCell) {
            moduleCell = Manipulator.getModuleCellFromCell(gridEntry.grid, false, false);
        }
        if (!moduleCell) { return; }
        gridEntry.focusedModuleCellId = moduleCell.getAttribute('id');

        if (oldFocusedModuleCellId) {
            /**
             * Event fired when we a cell that was focused lost the focus
             *
             * @event module:Grid.Data.Store#"grid.navigate.focus.off
             *
             * @property {String} name - The name of the Grid where the focus change
             * @property {int} oldFocusedModuleCellId - The ID of the module cell
             *                                              that just lost the focus
             */
            this.emit('grid.navigate.focus.off', gridName, oldFocusedModuleCellId);
        }

        /**
         * Event fired when we a cell that gain the focus
         *
         * @event module:Grid.Data.Store#"grid.navigate.focus.on
         *
         * @property {String} name - The name of the Grid where the focus change
         * @property {int} oldFocusedModuleCellId - The ID of the module cell
         *                                              that just gain the focus
         */
        this.emit('grid.navigate.focus.on', gridName, gridEntry.focusedModuleCellId);
    },

    /**
     * In the given grid, focus the cell next to the one actually selected.
     *
     * The way to select the cell to select is done by calling a method
     * of the Manipulator module: get{Right|Left|Bottom|Top}Cell.
     *
     * If no module cell is currently focused, the first one of the grid will be.
     *
     * @param  {String} gridName - The name of the grid on which to select a cell
     * @param  {String} manipulatorFindCellFunctionName - The name of the function of the
     *                                                    Manipulator module to call
     */
    focusNextModuleCell(gridName, manipulatorFindCellFunctionName) {
        let nextModuleCell;
        const focusedModuleCell = this.getFocusedModuleCell(gridName);
        if (focusedModuleCell) {
            nextModuleCell = Manipulator[manipulatorFindCellFunctionName](focusedModuleCell);
        }
        this.focusModuleCell(gridName, nextModuleCell, !focusedModuleCell);
    },

    /**
     * In the given grid, focus the cell next to the one actually selected in the index order
     *
     * @param  {String} gridName - The name of the grid on which to select a cell
     * @param  {int} delta - How many cell to move. 1 is the next one, -1 the previous one...
     */
    focusNextModuleCellByIndex(gridName, delta) {
        let nextModuleCell;
        const focusedModuleCell = this.getFocusedModuleCell(gridName);
        const currentIndex = parseInt(focusedModuleCell ? focusedModuleCell.getAttribute('module-index') || 0 : 0, 10);
        const newIndex = currentIndex + delta;
        const allModuleCells = this.getGrid(gridName).querySelectorAll('cell[type=module]');
        if (newIndex >= 0 && currentIndex < allModuleCells.length) {
            nextModuleCell = allModuleCells[newIndex];
        } else {
            return;
        }
        this.focusModuleCell(gridName, nextModuleCell, !focusedModuleCell);
    },

    /**
     * Try to focus the next module cell on the right of the current one for the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.focusRightModuleCell Actions.focusRightModuleCell}
     *
     * @param  {String} gridName - The name of the grid where we want to focus a cell
     * @param  {Boolean} [useModuleIndex==false] - `true` to focus on the next module in the index order.
     *                                             `false` to try to get the nearest module on the right
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusRightModuleCell(gridName, useModuleIndex) {
        if (useModuleIndex) {
            this.focusNextModuleCellByIndex(gridName, 1);
        } else {
            this.focusNextModuleCell(gridName, 'getRightCell');
        }
    },

    /**
     * Try to focus the previous module cell on the left of the current one for the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.focusLeftModuleCell Actions.focusLeftModuleCell}
     *
     * @param  {String} gridName - The name of the grid where we want to focus a cell
     * @param  {Boolean} [useModuleIndex=false] - `true` to focus on the previous module in the index order.
     *                                            `false` to try to get the nearest module on the left
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusLeftModuleCell(gridName, useModuleIndex) {
        if (useModuleIndex) {
            this.focusNextModuleCellByIndex(gridName, -1);
        } else {
            this.focusNextModuleCell(gridName, 'getLeftCell');
        }
    },

    /**
     * Try to focus the next module cell on the bottom of the current one for the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.focusBottomModuleCell Actions.focusBottomModuleCell}
     *
     * @param  {String} gridName - The name of the grid where we want to focus a cell
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusBottomModuleCell(gridName) {
        this.focusNextModuleCell(gridName, 'getBottomCell');
    },

    /**
     * Try to focus the previous module cell on the top of the current one for the given grid
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.focusTopModuleCell Actions.focusTopModuleCell}
     *
     * @param  {String} gridName - The name of the grid where we want to focus a cell
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusTopModuleCell(gridName) {
        this.focusNextModuleCell(gridName, 'getTopCell');
    },

    /**
     * Set one-screen for the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.enterOneScreenMode Actions.enterOneScreenMode}
     *
     * @param {String} gridName - The name of the grid for witch we want to enter the one-screen mode
     *
     * @fires module:Grid.Data.Store#"grid.oneScreenMode.enter"
     */
    enterOneScreenMode(gridName) {
        this.setOneScreenMode(gridName, true);

        /**
         * Event fired when a grid enters one-screen mode
         *
         * @event module:Grid.Data.Store#"grid.oneScreenMode.enter"
         *
         * @property {String} gridName - The name of the updated grid
         */
        this.emit('grid.oneScreenMode.enter', gridName);
    },

    /**
     * Exit one-screen mode for the given grid.
     *
     * It's an action, should be called via
     * {@link module:Grid.Data.Actions.exitOneScreenMode Actions.exitOneScreenMode}
     *
     * @param {String} gridName - The name of the grid for witch we want to exit the one-screen mode
     *
     * @fires module:Grid.Data.Store#"grid.oneScreenMode.exit"
     */
    exitOneScreenMode(gridName) {
        this.setOneScreenMode(gridName, false);

        /**
         * Event fired when a grid exits one-screen mode
         *
         * @event module:Grid.Data.Store#"grid.oneScreenMode.exit"
         *
         * @property {String} gridName - The name of the updated grid
         */
        this.emit('grid.oneScreenMode.exit', gridName);
    },

    /**
     * Set the one-screen mode for a grid from the store by its name.
     *
     * @param  {String} gridName - Name of the grid for which we want to set the one-screen mode
     * @param {bool} active - The new one-screen mode step for the grid
     */
    setOneScreenMode(gridName, active) {
        const grid = this.getGridEntry(gridName);
        grid.oneScreenMode = !!active;
    },

    // add the public interface
    exports: Store

};

// hidden ref to private interface from the store, to access in tests
Private.exports.__private = Private;


// Exceptions must be based on the Error class
Exceptions.normalize(Store.Exceptions);


Store = flux.createStore(Private);

Store.__private = Private;

// exceptions must be accessible via the private api too
Private.Exceptions = Store.Exceptions;

export { Store };
