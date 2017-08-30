import _ from 'lodash';
import Mousetrap from 'br-mousetrap';

import React from 'react';

import { Exceptions as GlobalExceptions } from '../../';


/**
 * Exceptions for the MouseTrap hOC
 * @memberOf module:Utils.React.Hoc.Mousetrap
 * @namespace
 */
const Exceptions = {
    /**
     *
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
};

// Exceptions must be based on the Error class
GlobalExceptions.normalize(Exceptions);


/**
 * A function to enhance via a HOC components that want to react to keyboard events
 *
 * Each wrapped component using this HOC receive these two methods in their props
 *
 *  - `bindShortcut`
 *  - `unbindShortcut`
 *
 * @memberOf module:Utils.React.Hoc
 *
 * @summary A function to enhance components that want to react to keyboard events
 *
 * @param {class} WrappedComponent - The react component to enhance
 *
 * @return {class} - {@link module:Utils.React.Hoc.activateMouseTrap.MouseTrap}
 */
const activateMouseTrap = (WrappedComponent) => {

    /**
     * Wrap a component using parameters given to {@link module:Utils.React.Hoc.activateMouseTrap}
     *
     * @memberOf module:Utils.React.Hoc.activateMouseTrap
     */
    class MouseTrap extends React.Component {

        constructor(props) {
            super(props);
            this._mousetrapBindings = {};
            this.bindShortcut = this.bindShortcut.bind(this);
            this.unbindShortcut = this.unbindShortcut.bind(this);
        }

        /**
         * Bind a keyboard shortcut to a callback
         *
         * @param  {String} key - The string representation of the shortcut to catch
         * @param  {Function} callback - The callback to call when the shortcut is caught
         */
        bindShortcut(key, callback) {
            if (typeof this._mousetrapBindings[key] !== 'undefined') {
                throw new Exceptions.Inconsistency(
                    `The shortcut <${key}> is already defined for this component`
                );
            }
            Mousetrap.bind(key, callback);
            this._mousetrapBindings[key] = callback;
        }

        /**
         * Unbind the shortcut (given by its key) from its registered callback
         *
         * @param  {String} key - The string representation of the shortcut to unbind
         */
        unbindShortcut(key) {
            if (typeof this._mousetrapBindings[key] === 'undefined') {
                throw new Exceptions.Inconsistency(
                    `The shortcut <${key}> is not defined for this component`
                );
            }
            Mousetrap.unbind(key, this._mousetrapBindings[key]);
            delete this._mousetrapBindings[key];
        }

        /**
         * Unbind all shortcuts associated to this component
         */
        unbindAllShortcuts() {
            _.forOwn(this._mousetrapBindings, (callback, key) => {
                Mousetrap.unbind(key, callback);
            });
            this._mousetrapBindings = {};
        }

        /**
         * When the component is unmounted, unbind all its associated shortcuts
         */
        componentWillUnmount() {
            this.unbindAllShortcuts();
        }


        render() {
            const newProps = {
                ref: (c) => {
                    this.wrappedRef = c;
                },
                bindShortcut: this.bindShortcut,
                unbindShortcut: this.unbindShortcut
            };
            return <WrappedComponent {...this.props} {...newProps} />;
        }

    }

    MouseTrap.displayName = 'MouseTrap';

    return MouseTrap;
};

export { activateMouseTrap, Exceptions };
