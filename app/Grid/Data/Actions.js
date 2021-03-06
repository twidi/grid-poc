import _ from 'lodash';
import flux from 'flux-react';


/**
 * Grid store actions
 * @memberOf module:Grid.Data
 * @class
 */
let Actions = {
    // Here are just definitions of functions. There are really created by the
    // "flux.createActions" call

    /**
     * Add a grid to the list of grids
     *
     * @type {function}
     *
     * @param {Element|Node|XML} grid - The grid to add to the list
     *
     * @fires module:Grid.Data.Store#"grid.add"
     */
    addGrid(grid) {},

    /**
     * Add a module to the given grid
     *
     * @type {function}
     *
     * @param {String} gridName - The name of the grid on which to add the module
     * @param {String} module - The path of the module to use
     * @param {Object} params - An flat object with all attributes of this module
     *
     * @fires module:Grid.Data.Store#"grid.designMode.module.add"
     */
    addModule(gridName, module, params) {},

    /**
     * Remove a module from the given grid
     *
     * @type {function}
     *
     * @param  {String} gridName - The grid from which we want to remove the module
     * @param  {Element|Node|XML} moduleCell - The module cell to remove
     *
     * @fires module:Grid.Data.Store#"grid.designMode.module.remove"
     */
    removeModule(gridName, moduleCell) {},

    /**
     * Set design mode for the given grid
     *
     * @type {function}
     *
     * @param {String} gridName - The name of the grid for witch we want to enter the design mode
     *
     * @fires module:Grid.Data.Store#"grid.designMode.enter"
     */
    enterDesignMode(gridName) {},

    /**
     * Exit design mode for the given grid
     *
     * @type {function}
     *
     * @param {String} gridName - The name of the grid for witch we want to exit the design mode
     *
     * @fires module:Grid.Data.Store#"grid.designMode.exit"
     */
    exitDesignMode(gridName) {},

    /**
     * Start dragging the given module in the given grid
     *
     * @type {function}
     *
     * @param {String} gridName - The name of the grid for witch we want to start dragging
     * @param {Element|Node|XML} moduleCell - The "module" cell containing the module we want to drag
     *
     * @fires module:Grid.Data.Store#"grid.designMode.dragging.start"
     */
    startDragging(gridName, moduleCell) {},

    /**
     * Stop dragging the currently dragged module in the given grid
     *
     * @type {function}
     *
     * @param {String} gridName - The name of the grid for witch we want to stop dragging
     *
     * @fires module:Grid.Data.Store#"grid.designMode.dragging.stop"
     */
    cancelDragging(gridName) {},

    /**
     * The currently dragged module start hovering a placeholder
     *
     * @type {function}
     *
     * @param {String} gridName - The name of the grid on witch the hovering occurs
     * @param {Element|Node|XML} [placeholderCell=] - The "placeholder" cell where we the module is hover
     *
     * @fires module:Grid.Data.Store#"grid.designMode.hovering.start"
     */
    startHovering(gridName, placeholderCell) {},

    /**
     * The currently dragged module moves away from the placeholder it was hover
     *
     * @type {function}
     *
     * @param {String} gridName - The name of the grid on witch the hovering occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.hovering.stop"
     */
    stopHovering(gridName) {},

    /**
     * Drop the currently dragged module in the current hovering placeholder
     *
     * @type {function}
     *
     * @param {String} gridName - The name of the grid for witch we want to start dragging
     * @param {Element|Node|XML} [placeholderCell=] - The "placeholder" cell where we want to drag the cell
     * to be dropped on. If defined, will replace the one saved in the store.
     *
     * @fires module:Grid.Data.Store#"grid.designMode.drop"
     */
    drop(gridName, placeholderCell) {},

    /**
     * Start moving the given resizer on the given grid
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid on witch the resizing occurs
     * @param  {Element|Node|XML} resizer - The resizer of the grid being moved
     * @param  {int} fullSize - The full size (height if horizontal resizer, or width)
     *                              of the previous and next nodes
     * @param  {int} initialPos - The position of the mouse acting as a starting point for the resizing
     *
     * @fires module:Grid.Data.Store#"grid.designMode.resizing.start"
     */
    startResizing(gridName, resizer, fullSize, initialPos) {},

    /**
     * Move a resizer to resize its previous and next nodes
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid on witch the resizing occurs
     * @param  {int} currentPos - The position of the mouse at the moment where the action is called
     *                                to compute the new sizes of the previous and next nodes
     *
     * @fires module:Grid.Data.Store#"grid.designMode.resizing.move"
     */
    resize(gridName, currentPos) {},

    /**
     * Stop moving the given resizer on the given grid
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid on witch the resizing occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.resizing.stop"
     */
    stopResizing(gridName) {},

    /**
     * Use the previous version of grid found in its history
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid on witch the undo occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.history.back"
     */
    goBackInHistory(gridName) {},

    /**
     * Use the next version of grid found in its history
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid on witch the redo occurs
     *
     * @fires module:Grid.Data.Store#"grid.designMode.history.forward"
     */
    goForwardInHistory(gridName) {},

    /**
     * Focus the given module cell in the given grid. If not possible, focus
     * the first available module cell if asked
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid for which we want to focus a cell
     * @param  {Element|Node|XML} [moduleCell=] - The module cell we want to set the focus on
     * @param  {Boolean} [defaultToFirstModuleCell=false]
     *         - `true` if we want to focus the first available cell if the given one is not available
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusModuleCell(gridName, moduleCell, defaultToFirstModuleCell) {},

    /**
     * Try to focus the next module cell on the right of the current one for the given grid
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid where we want to focus a cell
     * @param  {Boolean} [useModuleIndex=false] - `true` to focus on the next module in the index order.
     *                                            `false` to try to get the nearest module on the right
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusRightModuleCell(gridName, useModuleIndex) {},

    /**
     * Try to focus the previous module cell on the left of the current one for the given grid
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid where we want to focus a cell
     * @param  {Boolean} [useModuleIndex=False] - `true` to focus on the previous module in the index order.
     *                                            `false` to try to get the nearest module on the left
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusLeftModuleCell(gridName, useModuleIndex) {},

    /**
     * Try to focus the next module cell on the bottom of the current one for the given grid
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid where we want to focus a cell
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusBottomModuleCell(gridName) {},

    /**
     * Try to focus the previous module cell on the top of the current one for the given grid
     *
     * @type {function}
     *
     * @param  {String} gridName - The name of the grid where we want to focus a cell
     *
     * @fires module:Grid.Data.Store#"grid.navigate.focus.off"
     * @fires module:Grid.Data.Store#"grid.navigate.focus.on"
     */
    focusTopModuleCell(gridName) {},

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
    enterOneScreenMode(gridName) {},

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
    exitOneScreenMode(gridName) {}
};

Actions = flux.createActions(_.keys(Actions));

export { Actions };
