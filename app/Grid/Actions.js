var _ = require('lodash');
var flux = require('flux-react');


/**
 * Grid store actions
 * @namespace
 * @memberOf module:Grid
 *
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
     */
    addGrid: function(grid) {},

    /**
     * Set design mode for the given grid
     *
     * @type {function}
     *
     * @param {string} name - The grid for witch we want to enter the design mode
     */
    enterDesignMode: function(name) {},


    /**
     * Exit design mode for the given grid
     *
     * @type {function}
     *
     * @param {string} name - The grid for witch we want to exit the design mode
     */
    exitDesignMode: function(name) {},
};

module.exports = flux.createActions(_.keys(Actions));