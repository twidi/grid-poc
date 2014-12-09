/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var NodeMixin = require('./Mixins/Node.jsx');


/**
 * Row component, a row of a grid, composed of cells
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The Row component, a row of a grid
 * @mixes module:Grid.Components.Mixins.NodeMixin
 */
var Row = {
    mixins: [
        NodeMixin
    ],

    /**
     * Tell if the row is a placeholder
     * @return {Boolean} true if a placeholder
     */
    isPlaceholder: function() {
        return this.props.node.getAttribute('type') == 'placeholder';
    },

    /**
     * Get all the cells of the row
     * @return {array} - An array of XML grid cells
     */
    getCells: function() {
        return _.toArray(this.props.node.querySelectorAll(':scope > cells'));
    },

    /**
     * Render each cell as {@link module:Grid.Components.Cell Cell} components
     *
     */
    renderCells: function() {
        var Cell = require('./Cell.jsx');

        return _.map(this.getCells(), function(cell){
            return <Cell node={cell} key={Store.getNodeId(cell)}/>;
        }, this);
    },

    /**
     * Render the component mainly by calling renderCells
     */
    render: function() {
        return <li>Row{this.isPlaceholder()?' (placeholder)':''} with cells:
            <ul>
                {this.renderCells()}
            </ul>
        </li>

    }

};

module.exports = React.createClass(Row);
