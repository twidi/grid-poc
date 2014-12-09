/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var stringify = require('json-stable-stringify');

var Actions = require('../Actions.js');
var Modules = require('../Modules.js');
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

    statics: {
        moduleHolderClassName: 'moduleHolder',
        _modulesHolderCache: {},
    },

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
        return <div/>
    },

    /**
     * Will return a standalone div holding the module component for the current cell.
     * This module is rendered and tied to a non-react div, and is cached (based
     * on its set of attributes), so there is only one
     * To be displayed the div must be added to the dom node of the cell.
     *
     * @return {ReactComponent} - The div holding the rendered react component
     */
    getModuleComponent: function() {
        // it's where the module information are
        var contentNode = this.props.node.querySelector(':scope > content');

        // get all attributes of the content node, to use as props for the
        // module component
        var attributes = _.reduce(
                            contentNode.attributes,
                            function(r, a) { r[a.name] = a.value; return r; }, {}
                        );

        // compute the cache key of the module component by using 
        var key = stringify(attributes);
        if (typeof Cell._modulesHolderCache[key] === 'undefined') {
            // will be something like "Modules.foo"
            var componentPath = contentNode.getAttribute('component');
            // Remove the "Modules." part, as they are all hold in the Modules module
            var modulePath = componentPath.split('.').splice(1).join('/');
            // create a react *element* for the wanted module, with the content
            // attritutes as props
            var element = React.createElement(Modules[modulePath], attributes);
            // will hold the rendered module component
            var holder = document.createElement('div');
            // render the module component once for all
            var component = React.render(element, holder);
            holder.className = Cell.moduleHolderClassName;
            holder.key = key;
            // and save the rendered module component in the cache
            Cell._modulesHolderCache[key] = holder;
        }

        // returs the rendered module component from the cache
        return Cell._modulesHolderCache[key];
    },


    /**
     * Will attach the module component for the current cell to its dom node
     */
    attachModule: function() {
        this.module = this.getModuleComponent();
        this.getDOMNode().appendChild(this.module);
    },

    /**
     * Will attach the module component for the current cell from its dom node
     */
    detachModule: function() {
        var domNode = this.getDOMNode();
        var moduleNode = domNode.querySelector(':scope > .' + Cell.moduleHolderClassName)
        if (moduleNode) {
            domNode.removeChild(moduleNode);
        }
    },

    /**
     * If the cell is a module, attach the module component to the cell dom node
     * when the cell is rendered in the dom for the first time
     */
    componentDidMount: function() {
        if (this.getType() == 'module') {
            this.attachModule();
        }
    },

    /**
     * If the cell is a module, detach the module component to the cell dom node
     * when the cell is to be removed from the dom
     */
    componentWillUnmount: function() {
        if (this.getType() == 'module') {
            this.detachModule();
        }
    },

    /**
     * If the cell is a module, detach the module component to the cell dom node
     * when the rendering of the cell is to be updated
     */
    componentWillUpdate: function() {
        if (this.getType() == 'module') {
            this.detachModule();
        }
    },

    /**
     * If the cell is a module, attach the module component to the cell dom node
     * when the rendering of the cell is updated in the dom
     */
    componentDidUpdate: function() {
        if (this.getType() == 'module') {
            this.attachModule();
        }
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

module.exports = Cell = React.createClass(Cell);
