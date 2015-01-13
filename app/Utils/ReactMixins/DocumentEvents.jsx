/** @jsx React.DOM */
var React = require('react/addons');  // react + addons
var _ = require('lodash');


/**
 * A mixin to be used by components that need to react to document events
 *
 * Each component using this mixin can use these two methods
 *
 *  - `addDocumentListener`
 *  - `removeDocumentListener`
 *
 *
 * @mixin
 * @memberOf module:Utils.ReactMixins
 * @summary A mixin to be used by components that need to react to document events
 */
var DocumentEvents = {

    /**
     * Return a bound method for the given methodName.
     *
     * The bounded function is cached to always have the same result to use in 
     * addEventListener and removeEventListener
     *
     * @param  {string} methodName - The name of the method to bind
     *
     * @return {function} - The wanted function, bound to this
     */
    documentEvent: function(methodName) {
        // object to  hold cached bounded function
        // cannot be defined in the mixin if we want to have each instance to have
        // its own entry
        if (!this._documentEventCache) { this._documentEventCache = {}; }

        // set a bound callback in the cache
        if (typeof this._documentEventCache[methodName] === 'undefined') {
            this._documentEventCache[methodName] = _.bind(this[methodName], this);
        }
        // return the bound callback
        return this._documentEventCache[methodName];
    },

    /**
     * Clear from the cache the bound function for the given method name
     *
     * @param  {string} methodName - The name of the method for which we want to bound version be removed from the cache
     * @return {} - nothing
     */
    clearDocumentEventCache: function(methodName) {
        if (!this._documentEventCache) { return; }
        delete this._documentEventCache[methodName];
    },

    /**
     * Clear the whole cache of bound methods
     *
     * @return {} - nothing
     */
    clearAllDocumentEventsCache: function() {
        if (!this._documentEventCache) { return; }
        var names = _.keys(this._documentEventCache);
        for (var i = names.length - 1; i >= 0; i--) {
            delete this._documentEventCache[names[i]];
        }
    },

    /**
     * Add an event listener on "document" for the given event, to call the given method name
     *
     * @param {string} eventName - The event name to listen to on the document
     * @param {string} methodName - The name of the method of `this` to call when the event is fired
     */
    addDocumentListener: function(eventName, methodName) {
        document.addEventListener(eventName, this.documentEvent(methodName));
    },


    /**
     * Remove the event listener on "document" for the given event, that was set to call the given method name
     *
     * @param {string} eventName - The event name to stop listening to on the document
     * @param {string} methodName - The name of the method of `this` to stop calling call when the event is fired
     */
    removeDocumentListener: function(eventName, methodName) {
        document.removeEventListener(eventName, this.documentEvent(methodName));
    },


};

module.exports = DocumentEvents;