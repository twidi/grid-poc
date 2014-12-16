var _ = require('lodash');
var flux = require('flux-react');


/**
 * Grid store actions
 * @namespace
 * @memberOf module:Grid
 */
var Actions = {
    // Here are just definitions of functions. There are really created by the
    // "flux.createActions" call

    /**
     * Add a grid to the list of grids
     *
     * @type {function}
     *
     * @param {XML} grid - The grid to add to the list
     *
     * @fires module:Grid.Store#"grid.add"
     */
    addGrid: function(grid) {},

    /**
     * Set design mode for the given grid
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to enter the design mode
     *
     * @fires module:Grid.Store#"grid.designMode.enter"
     */
    enterDesignMode: function(gridName) {},


    /**
     * Exit design mode for the given grid
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to exit the design mode
     *
     * @fires module:Grid.Store#"grid.designMode.exit"
     */
    exitDesignMode: function(gridName) {},

    /**
     * Start dragging the given module in the given grid
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to start dragging
     * @param {XML} moduleCell - The "module" cell containing the module we want to drag
     *
     * @fires module:Grid.Store#"grid.designMode.dragging.start"
     */
    startDragging: function(gridName, moduleCell) {},

    /**
     * Stop dragging the currently dragged module in the given grid
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to stop dragging
     *
     * @fires module:Grid.Store#"grid.designMode.dragging.stop"
     */
    cancelDragging: function(gridName) {},

    /**
     * The currently dragged module start hovering a placeholder
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid on witch the hovering occurs
     * @param {XML} placeholderCell - The "placeholder" cell where we the module is hover
     *
     * @fires module:Grid.Store#"grid.designMode.hovering.start"
     * @fires module:Grid.Store#"grid.designMode.hovering.stay" (after a delay)
     */
    startHovering: function(gridName, placeholderCell) {},

    /**
     * The currently dragged module moves away from the placeholder it was hover
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid on witch the hovering occurs
     *
     * @fires module:Grid.Store#"grid.designMode.hovering.stop"
     */
    stopHovering: function(gridName) {},

    /**
     * Drop the currently dragged module in the current hovering placeholder
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to start dragging
     *
     * @fires module:Grid.Store#"grid.designMode.drop"
     */
    drop: function(gridName) {},
};

module.exports = flux.createActions(_.keys(Actions));