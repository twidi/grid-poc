var _ = require('lodash');
var flux = require('flux-react');


/**
 * Grid store actions
 * @namespace
 * @memberOf module:Grid
 * @summary Grid store actions
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
     * @fires module:Grid.Store#change
     * @fires module:Grid.Store#grid.add
     */
    addGrid: function(grid) {},

    /**
     * Set design mode for the given grid
     *
     * @type {function}
     *
     * @param {string} name - The name of the grid for witch we want to enter the design mode
     *
     * @fires module:Grid.Store#change
     * @fires module:Grid.Store#grid.designMode.enter
     */
    enterDesignMode: function(name) {},


    /**
     * Exit design mode for the given grid
     *
     * @type {function}
     *
     * @param {string} name - The name of the grid for witch we want to exit the design mode
     *
     * @fires module:Grid.Store#change
     * @fires module:Grid.Store#grid.designMode.exit
     */
    exitDesignMode: function(name) {},
};

module.exports = flux.createActions(_.keys(Actions));