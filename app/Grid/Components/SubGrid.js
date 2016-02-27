/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons

var GridMixin = require('./Mixins/Grid');
var NodeMixin = require('./Mixins/Node');


/**
 * SubGrid component, a grid inside a cell, composed of rows
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The SubGrid component, inside a cell
 * @mixes module:Grid.Components.Mixins.Node
 * @mixes module:Grid.Components.Mixins.Grid
 */

var SubGrid = {
    mixins: [
        NodeMixin,
        GridMixin
    ],

    /**
     * Render the component mainly by calling renderRows
     */
    render: function() {
        return this.renderGrid();
    }
};

module.exports = SubGrid = React.createClass(SubGrid);
