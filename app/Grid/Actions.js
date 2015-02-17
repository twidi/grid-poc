import _ from 'lodash';
import flux from 'flux-react';


/**
 * Grid store actions
 * @namespace
 * @memberOf module:Grid
 */
let Actions = {
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
    addGrid(grid) {},

    /**
     * Add a module to the given grid
     *
     * @type {function}
     *
     * @param {XML} gridName - The name of the grid on which to add the module
     * @param {String} module - The path of the module to use
     * @param {Object} params - An flat object with all attributes of this module
     *
     * @fires module:Grid.Store#"grid.designMode.module.add"
     */
    addModule(gridName, module, params) {},

    /**
     * Remove a module from the given grid
     *
     * @type {function}
     *
     * @param  {String} gridName - The grid from which we want to remove the module
     * @param  {XML} moduleCell - The module cell to remove
     *
     * @fires module:Grid.Store#"grid.designMode.module.remove"
     */
    removeModule(gridName, moduleCell) {},

    /**
     * Set design mode for the given grid
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to enter the design mode
     *
     * @fires module:Grid.Store#"grid.designMode.enter"
     */
    enterDesignMode(gridName) {},


    /**
     * Exit design mode for the given grid
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to exit the design mode
     *
     * @fires module:Grid.Store#"grid.designMode.exit"
     */
    exitDesignMode(gridName) {},

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
    startDragging(gridName, moduleCell) {},

    /**
     * Stop dragging the currently dragged module in the given grid
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to stop dragging
     *
     * @fires module:Grid.Store#"grid.designMode.dragging.stop"
     */
    cancelDragging(gridName) {},

    /**
     * The currently dragged module start hovering a placeholder
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid on witch the hovering occurs
     *
     * @fires module:Grid.Store#"grid.designMode.hovering.start"
     */
    startHovering(gridName, placeholderCell) {},

    /**
     * The currently dragged module moves away from the placeholder it was hover
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid on witch the hovering occurs
     * @param {XML} placeholderCell - The "placeholder" cell where we the module is hover
     *
     * @fires module:Grid.Store#"grid.designMode.hovering.stop"
     */
    stopHovering(gridName) {},

    /**
     * Drop the currently dragged module in the current hovering placeholder
     *
     * @type {function}
     *
     * @param {string} gridName - The name of the grid for witch we want to start dragging
     * @param {XML} [placeholderCell=null] - The "placeholder" cell where we want to drag the cell
     * to be dropped on. If defined, will replace the one saved in the store.
     *
     * @fires module:Grid.Store#"grid.designMode.drop"
     */
    drop(gridName, placeholderCell) {},

    /**
     * Start moving the given resizer on the given grid
     *
     * @type {function}
     *
     * @param  {string} gridName - The name of the grid on witch the resizing occurs
     * @param  {XML} resizer - The resizer of the grid beingmoved
     * @param  {Integer} fullSize - The full size (height if horizontal resizer, or width) of the previous and next nodes
     * @param  {Integer} initialPos - The position of the mouse acting as a starting point for the resizing
     *
     * @fires module:Grid.Store#"grid.designMode.resizing.start"
     */
    startResizing(gridName, resizer, fullSize, initialPos) {},

    /**
     * Move a resizer to resize its previous and next nodes
     *
     * @type {function}
     *
     * @param  {string} gridName - The name of the grid on witch the resizing occurs
     * @param  {Integer} currentPos - The position of the mouse at the moment where the action is called
     *                                to compute the new sizes of the previous and next nodes
     *
     * @fires module:Grid.Store#"grid.designMode.resizing.move"
     */
    resize(gridName, currentPos) {},

    /**
     * Stop moving the given resizer on the given grid
     *
     * @type {function}
     *
     * @param  {string} gridName - The name of the grid on witch the resizing occurs
     *
     * @fires module:Grid.Store#"grid.designMode.resizing.stop"
     */
    stopResizing(gridName) {},

    /**
     * Use the previous version of grid found in its history
     *
     * @type {function}
     *
     * @param  {string} gridName - The name of the grid on witch the undo occurs
     *
     * @fires module:Grid.Store#"grid.designMode.history.back"
     */
    goBackInHistory(gridName) {},

    /**
     * Use the next version of grid found in its history
     *
     * @type {function}
     *
     * @param  {string} gridName - The name of the grid on witch the redo occurs
     *
     * @fires module:Grid.Store#"grid.designMode.history.forward"
     */
    goForwardInHistory(gridName) {}
};

Actions = flux.createActions(_.keys(Actions));

export { Actions };
