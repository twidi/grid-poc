var _ = require('lodash');
var flux = require('flux-react');

var Actions = require('./Actions.js');
var Manipulator = require('./Manipulator.js');


/**
 * Store grids. This is the public interface
 * @namespace
 * @memberOf module:Grid
 *
 */
var Store = {

    /**
     * Exceptions for the Store module
     * @namespace
     * @summary Exceptions available in Grid.Store.Exceptions
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
    },

    /**
     * Get a grid from the store by its name
     *
     * @param  {string} name - Name of the grid to get
     *
     * @return {XML} - The wanted XML grid
     *
     * @throws {module:Grid.Store.Exceptions.GridDoesNotExist} If the given name does not match an existing grid name
     */
    getGrid: function(name) {
        if (_.has(this.grids, name)) {
            return this.grids[name];
        } else {
            throw new this.Exceptions.GridDoesNotExist("No grid with the name <" + name + ">");
        }
    },
};


/**
 * Store grids. Everything can only be accessed inside the Store itself
 * @namespace
 * @summary The Store private members
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
     * It's an action, should be called via Grid.Actions.addGrid
     * @see module:Grid.Actions.addGrid
     */
    addGrid: function(grid) {
        var name = grid.getAttribute('name');
        if (!_.has(this.grids, name)) {
            this.grids[name] = grid;
        } else {
            throw new this.Exceptions.GridDoesNotExist("There is already a grid the name <" + name + ">");
        }
        this.emitChange();
        this.emit('add', name);
    },

    /**
     * It's an action, should be called via {@link module:Grid.Actions.enterDesignMode Grid.Actions.enterDesignMode}
     */
    enterDesignMode: function(name) {
    },

    /**
     * It's an action, should be called via Grid.Actions.exitDesignMode
     * @see module:Grid.Actions.exitDesignMode
     */
    exitDesignMode: function(name) {

    },

    exports: Store,

    Exceptions: Store.Exceptions,

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
