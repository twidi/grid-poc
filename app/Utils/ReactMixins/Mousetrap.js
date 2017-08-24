import _ from 'lodash';
import Mousetrap from 'br-mousetrap';

import { Exceptions } from '../Exceptions';


/**
 * A mixin to be used by components that need to react to keyboard events
 *
 * Each component using this mixin can use these methods
 *
 *  - `bindShortcut`
 *  - `unbindShortcut`
 *  - `unbindAllShortcuts`
 *
 * @mixin
 * @memberOf module:Utils.ReactMixins
 * @summary A mixin to be used by components that need to react to document events
 */
const MousetrapMixin = {

    /**
     * Statics for the MousetrapMixin module
     * @namespace
     */
    statics: {
        /**
         * Exceptions for the MousetrapMixin module
         * @namespace
         */
        Exceptions: {
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
            }
        }
    },

    /**
     * Bind a keyboard shortcut to a callback
     *
     * @param  {String} key - The string representation of the shortcut to catch
     * @param  {Function} callback - The callback to call when the shortcut is caught
     */
    bindShortcut(key, callback) {
        if (!this._mousetrapBindings) { this._mousetrapBindings = {}; }
        if (typeof this._mousetrapBindings[key] !== 'undefined') {
            throw new MousetrapMixin.statics.Exceptions.Inconsistency(
                `The shortcut <${key}> is already defined for this component`
            );
        }
        Mousetrap.bind(key, callback);
        this._mousetrapBindings[key] = callback;
    },

    /**
     * Unbind the shortcut (given by its key) from its registered callback
     *
     * @param  {String} key - The string representation of the shortcut to unbind
     */
    unbindShortcut(key) {
        if (!this._mousetrapBindings) { return; }
        if (typeof this._mousetrapBindings[key] === 'undefined') {
            throw new MousetrapMixin.statics.Exceptions.Inconsistency(
                `The shortcut <${key}> is not defined for this component`
            );
        }
        Mousetrap.unbind(key, this._mousetrapBindings[key]);
        delete this._mousetrapBindings[key];
    },

    /**
     * Unbind all shortcuts associated to this component
     */
    unbindAllShortcuts() {
        if (!this._mousetrapBindings) { return; }
        _.forOwn(this._mousetrapBindings, (callback, key) => {
            Mousetrap.unbind(key, callback);
        });
        this._mousetrapBindings = {};
    },

    /**
     * When the component is unmounted, unbind all its associated shortcuts
     */
    componentWillUnmount() {
        this.unbindAllShortcuts();
    }
};

// Exceptions must be based on the Error class
Exceptions.normalize(MousetrapMixin.statics.Exceptions);

export { MousetrapMixin };
