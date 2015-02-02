/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var DocumentEventsMixin = require('../../Utils/ReactMixins/DocumentEvents.jsx');
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
        DocumentEventsMixin,
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
     * Called in response to the `grid.designMode.resizing.move` event, when the
     * resizer is moved on the given Grid.
     *
     * @param  {String} gridName - The name of the grid where a resizer is moved
     * @param  {Object} resizeData - Contains data used to act in response to this
     * event (`previousRelativeSize` and `nextRelativeSize, the related sizes of
     * the nodes arround the resizer, on which to apply these values as "flex grow")
     */
    onResizingMove: function(gridName, resizeData) {
        if (!Store.isMovingResizer(gridName, this.state.node)) { return; }
        var domNode = this.getDOMNode();
        this.setDomNodeRelativeSise(domNode.previousSibling, resizeData.previousRelativeSize);
        this.setDomNodeRelativeSise(domNode.nextSibling, resizeData.nextRelativeSize);

    },

    /**
     * Use the given relativeSize to update the given domNode flex-grow style property
     *
     * @param {DomNode} domNode - The dom node tu update
     * @param {Float} relativeSize - The new relative size to apply
     */
    setDomNodeRelativeSise: function(domNode, relativeSize) {
        domNode.style.flexGrow = relativeSize;
    },

    /**
     * Called before detaching the component from the dom, to stop watching for 
     * events related to resizing
     */
    componentWillUnmount: function () {
        this.deactivateResizingDetection();
    },

    /**
     * Add a handler on the document to act react then the mouse is moved, or
     * released over the whole document, to intercept them and use them to
     * move the resizer, and stop it.
     * Also watch from the move event from the Store to do the resizing on
     * previous and next siblings
     */
    activateResizingDetection: function() {
        Store.on('grid.designMode.resizing.move', this.onResizingMove);
        this.addDocumentListener('mousemove', 'onDocumentMouseMove');
        this.addDocumentListener('mouseup', 'onDocumentMouseUp');
    },

    /**
     * Stop listening to events defined in `activateResizingDetection`, and to
     * the move event from the store
     */
    deactivateResizingDetection: function() {
        Store.off('grid.designMode.resizing.move', this.onResizingMove);
        this.removeDocumentListener('mousemove', 'onDocumentMouseMove');
        this.removeDocumentListener('mouseup', 'onDocumentMouseUp');
    },

    /**
     * Return the "size" of the given dom node. Size is the height of the width
     * depending of the resizer being horizontal or vertical
     *
     * @param  {DomNode} domNode - The dom node for which we want the size
     *
     * @return {Integer} - Size in pixels (without unit)
     */
    getDomNodeSize: function(domNode) {
        return domNode[this.isHorizontal() ? 'clientHeight' : 'clientWidth']
    },

    /**
     * Return the cursor position on the screen for the given event. Position is
     * the X or Y coordinage depending of the resizer being vertical or horizontal
     * @param  {[type]} event [description]
     * @return {[type]}       [description]
     */
    getScreenMousePosition: function(event) {
        return event[this.isHorizontal() ? 'screenY' : 'screenX'];
    },

    onMouseDown: function(event) {
        // say the world that we intercepted the event
        event.stopPropagation();
        event.preventDefault();

        var domNode = this.getDOMNode();

        // compute the total size of the nodes before and after the resizer
        var fullSize = this.getDomNodeSize(domNode.previousSibling) + this.getDomNodeSize(domNode.nextSibling);

        // look at where is located the mouse, to use it as a starting point
        var position = this.getScreenMousePosition(event);

        // indicate the store that the user want to start a resizing
        Actions.startResizing(this.getGridName(), this.state.node, fullSize, position);

        // listen to mousemove and mouseup events on the document o detect when
        // the user move or stop its resizing
        this.activateResizingDetection();
    },

    /**
     * Called when the mouse move over the document after a resizing started, to
     * tell the store that we moved
     *
     * @param  {event} event - The event that triggered this method
     */
    onDocumentMouseMove: function(event) {
        Actions.resize(this.getGridName(), this.getScreenMousePosition(event));
    },

    /**
     * Called when the mouse is released over the document during a resizing, to
     * tell the store that it has to stop the resize operation
     *
     * @param  {event} event - The event that triggered this method
     */
    onDocumentMouseUp: function(ev) {
        this.deactivateResizingDetection();
        Actions.stopResizing(this.getGridName());
    },

    /**
     * Return the attributes to use in the main node in the render method
     *
     * One special cases exist:
     *
     * - when design mode is simple "enabled", we activate the mouseDown event
     *   on the resizer to initiate the resizing
     *
     * @return {object} - A "dict" with the attributes
     */
    getRenderAttrs: function() {
        var attrs = {};
        if (this.getDesignModeStep() == 'enabled') {
            attrs.onMouseDown = this.onMouseDown;
        }
        return attrs;
    },

    /**
     * Render the component
     *
     * @returns {div} - A empty div with classes defined by `getResizerClasses`
     */
    render: function() {
        return <div className={this.getResizerClasses()} {...this.getRenderAttrs()}/>
    }

};

module.exports = Resizer = React.createClass(Resizer);
