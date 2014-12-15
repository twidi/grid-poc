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
    },

    /**
     * Get a grid from the store by its name. All nodes are ensured to have an ID.
     *
     * @param  {string} gridName - Name of the grid to get
     *
     * @return {XML} - The wanted XML grid
     *
     * @throws {module:Grid.Store.Exceptions.GridDoesNotExist} If the given name does not match an existing grid name
     */
    getGrid: function(gridName) {
        if (_.has(this.grids, gridName)) {
            var grid = this.grids[gridName];
        } else {
            throw new this.Exceptions.GridDoesNotExist("No grid with the name <" + gridName + ">");
        }
        Manipulator.setIds(grid);
        return grid;
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
     * @param  {XML} node - The XML node for which we want the id
     * @return {string} - The id attribute of the node
     */
    getNodeId: function(node) {
        return node.getAttribute('id');
    },

    /**
     * Return the main grid for the given node
     * @param  {XML} node - The XML node for which we want the grid
     * @return {XML} - The main grid of the node
     */
    getMainGrid: function(node) {
        return node.ownerDocument.documentElement;
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
     * All stored grids, by name
     * @type {Object}
     */
    grids: {},

    actions: _.values(Actions),


    /**
     * Add a grid to the list of grids.
     * It's an action, should be called via
     * {@link module:Grid.Actions.enterDesignMode Grid.Actions.addGrid}
     */
    addGrid: function(grid) {
        var name = grid.getAttribute('name');
        if (!_.has(this.grids, name)) {
            this.grids[name] = grid;
        } else {
            throw new this.Exceptions.GridDoesNotExist("There is already a grid the name <" + name + ">");
        }
        /**
         * Event fired when the store grid is updated
         *
         * @event module:Grid.Store#change
         */
        this.emitChange();
        /**
         * Event fired when a grid is added to the Grid store
         *
         * @event module:Grid.Store#grid.add
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
    enterDesignMode: function(name) {
        var grid = this.getGrid(name);
        Manipulator.addPlaceholders(grid);
        Manipulator.setIds(grid);
        this.emitChange();
        /**
         * Event fired when a grid enters design mode
         *
         * @event module:Grid.Store#grid.designMode.enter
         *
         * @property {string} name - The name of the updated grid
         */
        this.emit('grid.designMode.enter', name);
    },

    /**
     * Exit design mode for the given grid.
     * It's an action, should be called via
     * {@link module:Grid.Actions.enterDesignMode Grid.Actions.exitDesignMode}
     */
    exitDesignMode: function(name) {
        var grid = this.getGrid(name);
        Manipulator.removePlaceholders(grid);
        Manipulator.setIds(grid);
        this.emitChange();
        /**
         * Event fired when a grid exits design mode
         *
         * @event module:Grid.Store#grid.designMode.exit
         *
         * @property {string} name - The name of the updated grid
         */
        this.emit('grid.designMode.exit', name);
    },

    // add the public interface
    exports: Store,

};


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
