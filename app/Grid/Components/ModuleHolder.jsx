/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;
var stringify = require('json-stable-stringify');

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var ModulesCache = require('./ModulesCache.js');

var NodesHolderMixin = require('./Mixins/NodesHolder.jsx');


/**
 * This react component will hold a module in design mode, managing dragging, to
 * let the modules components strictly independent of the grid system.
 *
 * The hold module is not rendered as a child but detached/attached to this react
 * component dom node before/after mouting and updating, to avoid rerendering the
 * module at all costs. This is done by {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}
 *
 * @namespace
 *
 * @memberOf module:Grid.Components
 *
 * @summary A component to hold a module in design mode
 */
var ModuleHolder = {

    mixins: [
        NodesHolderMixin,
    ],

    dragLeaveTimeout: 200,

    /**
     * The type of node that can be attached to the current react component
     * dom node (managed by {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}):
     * - a module
     *
     * @type {Array}
     */
    externalNodesClassNames: [
        ModulesCache.moduleContainerClassName
    ],

    /**
     * Tell {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}
     * that this react component will always be able to hold a module.
     *
     * @return {boolean} - `true`
     */
    canHoldExternalNodes: function() {
        return true;
    },

    /**
     * Return the module to attach to the current react component dom node.
     *
     * It's take from the {@link module:Grid.Components.ModulesCache ModulesCache} module
     *
     * @param  {string} className - The class name of the dom node to return
     * @return {DomNode} - The module dom node
     */
    getExternalNode: function(className) {
        if (className == ModulesCache.moduleContainerClassName) {
            return ModulesCache.getModuleComponent(null, this.props.uniqueKey);
        };
    },

    /**
     * Call {@link module:Grid.Actions.startDragging startDragging} action when the drags of
     * the dom node starts.
     *
     * @param  {event} event - The dragStart event
     */
    onDragStart: function(event) {
        Actions.startDragging(this.props.gridName, this.props.gridCell);
        event.dataTransfer.setData('application/x-grid-module', this.props.gridName);
        event.dataTransfer.effectAllowed = 'move';
    },

    /**
     * Called when the dragged module leave this holder. It happens when the
     * placeholder is replaced by the holder after a certain amount of time
     * (when designModeStep goes from `prehovering` to `hovering)
     *
     * It calls {@link module:Grid.Actions.stopHovering stopHovering}
     *
     * @param  {event} event - The dragLeave event
     */
    onDragLeave: function(event) {
        // in case of fake drop, the dragleave event may occur just before, so w'ill wait a little
        setTimeout(function() {
            if (Store.getDesignModeStep(this.props.gridName) == 'hovering') {
                Actions.stopHovering(this.props.gridName);
            }
        }.bind(this), this.dragLeaveTimeout);
    },

    /**
     * Return the attributes to use in the main div node in the render method
     *
     * Two special cases exist:
     *
     * - the design mode is "enabled",so we make the element dragable
     * - the element is currently dragged, so we activate the dragleave event
     * 
     * @return {object} - A "dict" with the attributes
     */
    getRenderAttrs: function() {
        var attrs = {};

        if (Store.getDesignModeStep(this.props.gridName) == 'enabled') {
            // design mode activated, we can activate dragging
            attrs.draggable = true;
            attrs.onDragStart = this.onDragStart;

        } else if (Store.isDraggingCell(this.props.gridName, this.props.gridCell)) {

            // we are in design mode, at least dragging, but as the placeholder
            // we'll hover will be replaced by the module holder, we'll have to
            // leave the holder to tell the store that we left the placeholder
            attrs.onDragLeave = this.onDragLeave;
        }

        return attrs;
    },

    /**
     * Render the module holder, as a simple div with drag attributes/events, and
     * as a child, a div used as a cover over the module (attached via
     * {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}) to
     * drag the dom node without any risk of interacting with the module content
     */
    render: function() {
        return <div className='module-holder'
                    {...this.getRenderAttrs()}>
                    <div className="module-cover"/>
                </div>;
    }

};

module.exports = ModuleHolder = React.createClass(ModuleHolder);
