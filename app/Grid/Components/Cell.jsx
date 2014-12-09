/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var NodeMixin = require('./Mixins/Node.jsx');


/**
 * Cell component, a cell of a row. Can be a "grid" or a "module"
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The Cell component, a cell of a row
 * @mixes module:Grid.Components.Mixins.NodeMixin
 */
var Cell = {
    mixins: [
        NodeMixin
    ],

    /**
     * Get the type of the current XML Grid cell
     * @return {string} Either "grid", "module" or "placeholder"
     */
    getType: function() {
        return this.props.node.getAttribute('type');
    },

    /**
     * Tell if the cell is a placeholder
     * @return {Boolean} true if a placeholder
     */
    isPlaceholder: function() {
        return this.getType() == 'placeholder';
    },

    /**
     * Render the cell as a SubGrid component
     * @return {module:Grid.Components.SubGrid} - The rendered {@link module:Grid.Components.SubGrid SubGrid} component
     */
    renderAsSubGrid: function() {
        var SubGrid = require('./SubGrid.jsx');
         return <SubGrid node={this.props.node} />
    },

    /**
     * Render the cell as a module
     * @return ??
     */
    renderAsModule: function() {
        return <span>module...</span>
    },

    /**
     * Render the cell depending on its type
     */
    render: function() {
        switch(this.getType()) {
            case 'grid': 
                return <li>{this.renderAsSubGrid()}</li>;
            case 'module': 
                return <li>{this.renderAsModule()}</li>;
            case 'placeholder':
                return <li>(cell placeholder)</li>;
        }
    }

};

module.exports = React.createClass(Cell);
