import React from 'react';
import classnames from 'classnames';

import { Actions, Store } from '../Data';

import { GridNode } from './Bases';


/**
 * Resizer component, simple node to be moved to allow resizing
 *
 * @memberOf module:Grid.Components
 *
 * @summary Resizer component
 *
 * @extends module:Grid.Components.Bases.GridNode
 */
class Resizer extends GridNode {

    constructor(props) {
        super(props);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
        this.onDocumentMouseUp = this.onDocumentMouseUp.bind(this);
        this.onResizingMove = this.onResizingMove.bind(this);

        this.saveResizerRef = (ref) => { this.resizerRef = ref; };
    }

    /**
     * Tell if the row is a vertical
     *
     * @return {Boolean} - true if a the resizer is vertical
     */
    isVertical() {
        return this.state.node.getAttribute('type') === 'vertical';
    }

    /**
     * Tell if the row is a horizontal
     *
     * @return {Boolean} - true if a the resizer is horizontal
     */
    isHorizontal() {
        return this.state.node.getAttribute('type') === 'horizontal';
    }

    /**
     * Return the classes to use when rendering the current resizer.
     *
     * @return {String} - A string containing classes
     *
     * One or more of these classes:
     *
     * - `grid-resizer`: in all cases
     * - `grid-resizer-vertical`: if it's a vertical resizer
     * - `grid-resizer-horizontal`: if it's a horizontal resizer
     *
     */
    getResizerClasses() {
        const isVertical = this.isVertical();
        return classnames({
            'grid-resizer': true,
            'grid-resizer-vertical': isVertical,
            'grid-resizer-horizontal': !isVertical
        });
    }

    /**
     * Called in response to the `grid.designMode.resizing.move` event, when the
     * resizer is moved on the given Grid.
     *
     * @param  {String} gridName - The name of the grid where a resizer is moved
     * @param  {Object} resizeData - Contains data used to act in response to this
     * event (`previousRelativeSize` and `nextRelativeSize, the related sizes of
     * the nodes around the resizer, on which to apply these values as "flex grow")
     */
    onResizingMove(gridName, resizeData) {
        if (!Store.isMovingResizer(gridName, this.state.node)) { return; }
        const domNode = this.resizerRef;
        this.setDomNodeRelativeSize(domNode.previousSibling, resizeData.previousRelativeSize);
        this.setDomNodeRelativeSize(domNode.nextSibling, resizeData.nextRelativeSize);

    }

    /**
     * Use the given relativeSize to update the given domNode flex-grow style property
     *
     * @param {Element|Node|XML} domNode - The dom node tu update
     * @param {float} relativeSize - The new relative size to apply
     */
    setDomNodeRelativeSize(domNode, relativeSize) {
        domNode.style.flexGrow = relativeSize;
    }

    /**
     * Called before detaching the component from the dom, to stop watching for
     * events related to resizing
     */
    componentWillUnmount() {
        this.deactivateResizingDetection();
    }

    /**
     * Add a handler on the document to act react then the mouse is moved, or
     * released over the whole document, to intercept them and use them to
     * move the resizer, and stop it.
     * Also watch from the move event from the Store to do the resizing on
     * previous and next siblings
     */
    activateResizingDetection() {
        Store.on('grid.designMode.resizing.move', this.onResizingMove);
        document.addEventListener('mousemove', this.onDocumentMouseMove);
        document.addEventListener('mouseup', this.onDocumentMouseUp);
    }

    /**
     * Stop listening to events defined in `activateResizingDetection`, and to
     * the move event from the store
     */
    deactivateResizingDetection() {
        Store.off('grid.designMode.resizing.move', this.onResizingMove);
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        document.removeEventListener('mouseup', this.onDocumentMouseUp);
    }

    /**
     * Return the "size" of the given dom node. Size is the height of the width
     * depending of the resizer being horizontal or vertical
     *
     * @param  {Element|Node|XML} domNode - The dom node for which we want the size
     *
     * @return {int} - Size in pixels (without unit)
     */
    getDomNodeSize(domNode) {
        return domNode[this.isHorizontal() ? 'clientHeight' : 'clientWidth'];
    }

    /**
     * Return the cursor position on the screen for the given event. Position is
     * the X or Y coordinate depending of the resizer being vertical or horizontal
     *
     * @param  {event} event - The event that must have a `screenX` and `screenY` attributes
     * @return {int} - The asked mouse position
     */
    getScreenMousePosition(event) {
        return event[this.isHorizontal() ? 'screenY' : 'screenX'];
    }

    onMouseDown(event) {
        // say the world that we intercepted the event
        event.stopPropagation();
        event.preventDefault();

        const domNode = this.resizerRef;

        // compute the total size of the nodes before and after the resizer
        const fullSize = this.getDomNodeSize(domNode.previousSibling) + this.getDomNodeSize(domNode.nextSibling);

        // look at where is located the mouse, to use it as a starting point
        const position = this.getScreenMousePosition(event);

        // indicate the store that the user want to start a resizing
        Actions.startResizing(this.getGridName(), this.state.node, fullSize, position);

        // listen to mousemove and mouseup events on the document o detect when
        // the user move or stop its resizing
        this.activateResizingDetection();
    }

    /**
     * Called when the mouse move over the document after a resizing started, to
     * tell the store that we moved
     *
     * @param  {event} event - The event that triggered this method
     */
    onDocumentMouseMove(event) {
        Actions.resize(this.getGridName(), this.getScreenMousePosition(event));
    }

    /**
     * Called when the mouse is released over the document during a resizing, to
     * tell the store that it has to stop the resize operation
     *
     * @param  {event} event - The event that triggered this method
     */
    onDocumentMouseUp(event) {
        this.deactivateResizingDetection();
        Actions.stopResizing(this.getGridName());
    }

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
    getRenderAttrs() {
        const attrs = {};
        if (this.getDesignModeStep() === 'enabled') {
            attrs.onMouseDown = this.onMouseDown;
        }
        return attrs;
    }

    /**
     * Render the component
     *
     * @returns {Element|Node|XML} - A empty div with classes defined by `getResizerClasses`
     */
    render() {
        return (
            <div
                ref={this.saveResizerRef}
                className={this.getResizerClasses()}
                {...this.getRenderAttrs()}
            />
        );
    }

}

Resizer.displayName = 'Resizer';

export { Resizer };
