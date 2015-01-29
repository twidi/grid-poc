/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var NodeMixin = require('./Mixins/Node.jsx');


/**
 * Resizer component, simple node to be moved to allow resizing
 * @namespace
 * @memberOf module:Grid.Components
 * @summary Resizer component
 * @mixes module:Grid.Components.Mixins.Node
 */
var Resizer = {
    mixins: [
        NodeMixin
    ],

    /**
     * Tell if the row is a vertical
     *
     * @return {Boolean} - true if a the resizer is vertical
     */
    isVertical: function() {
        return this.state.node.getAttribute('type') == 'vertical';
    },

    /**
     * Tell if the row is a horizontal
     *
     * @return {Boolean} - true if a the resizer is horizontal
     */
    isHorizontal: function() {
        return this.state.node.getAttribute('type') == 'horizontal';
    },

    /**
     * Return the classes to use when rendering the current resizer.
     *
     * @return {React.addons.classSet}
     *
     * One or more of these classes:
     *
     * - `grid-resizer`: in all cases
     * - `grid-resizer-vertical`: if it's a vertical resizer
     * - `grid-resizer-horizontal`: if it's a horizontal resizer
     *
     */
    getResizerClasses: function() {
        var isVertical = this.isVertical();
        return cx({
            'grid-resizer': true,
            'grid-resizer-vertical': isVertical,
            'grid-resizer-horizontal': !isVertical,
        });
    },

    /**
     * Render the component
     *
     * @returns {div} - A empty div with classes defined by `getResizerClasses`
     */
    render: function() {
        return <div className={this.getResizerClasses()}/>
    }

};

module.exports = Resizer = React.createClass(Resizer);
