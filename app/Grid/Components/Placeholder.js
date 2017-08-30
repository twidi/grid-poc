import React from 'react';
import classnames from 'classnames';

import { Actions, Store } from '../Data';

import { GridNode } from './Bases';


/**
 * This react component will serve as a placeholder to drop modules in design mode
 *
 * @memberOf module:Grid.Components
 *
 * @summary A placeholder component to drop dragged modules
 *
 * @extends module:Grid.Components.Bases.GridNode
 */
class Placeholder extends GridNode {

    constructor(props) {
        super(props);
        this.onDocumentDetectDrop = this.onDocumentDetectDrop.bind(this);
        this.onDocumentDragEnd = this.onDocumentDragEnd.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);

        this.savePlaceholderRef = (ref) => { this.placeholderRef = ref; };
    }

    /**
     * Called when the dragged module enter the placeholder, to call
     * {@link module:Grid.Data.Actions.startHovering}
     *
     * @param  {event} event - The dragEnter event
     */
    onDragEnter(event) {
        event.preventDefault();
        Actions.startHovering(this.getGridName(), this.state.node);
    }

    /**
     * Called when the dragged module pass hover the placeholder, to call
     * {@link module:Grid.Data.Actions.startHovering}
     *
     * This should be done by onDragEnter, may sometimes this event is not fired
     *
     * @param  {event} event - The dragOver event
     */
    onDragOver(event) {
        event.preventDefault();
        // onDragEnter may have not been called. will do nothing if it's already the hovered placeholder
        Actions.startHovering(this.getGridName(), this.state.node);
    }

    /**
     * Called when the dragged module leave the placeholder, to call
     * {@link module:Grid.Data.Actions.stopHovering}
     *
     * @param  {event} event - The dragLeave event
     */
    onDragLeave(event) {
        if (Store.isHoveringPlaceholder(this.getGridName(), this.state.node)) {
            Actions.stopHovering(this.getGridName());
        }
    }

    /**
     * Stop trying to detect the drop on the document when unmounting the react component
     */
    componentWillUnmount() {
        this.deactivateDropDetection();
    }

    /**
     * Start trying to detect the drop on the document when mounting the react component
     */
    componentDidMount() {
        this.activateDropDetection();
    }

    /**
     * Stop trying to detect the drop on the document before updating the react component
     *
     * @param {object} nextProps - New component props used for the update
     * @param {object} nextState - New component state used for the update
     */
    componentWillUpdate(nextProps, nextState) {
        this.deactivateDropDetection();
    }

    /**
     * Start trying to detect the drop on the document after updating the react component
     *
     * @param {object} prevProps - Component props before the update
     * @param {object} prevState - Component state before the update
     */
    componentDidUpdate(prevProps, prevState) {
        this.activateDropDetection();
    }

    /**
     * Add a handler on the document to act when a fake drop was detected over
     * a placeholder.
     *
     * And it also listen for a `fakedragend` event, triggered when a drop operation is done.
     */
    activateDropDetection() {
        if (this.dropDetectionActivated) { return; }
        this.dropDetectionActivated = true;
        document.addEventListener('fakedrop', this.onDocumentDetectDrop);
        document.addEventListener('fakedragend', this.onDocumentDragEnd);
    }

    /**
     * Stop listening to events defined in `activateDropDetection`
     */
    deactivateDropDetection() {
        if (!this.dropDetectionActivated) { return; }
        this.dropDetectionActivated = false;
        document.removeEventListener('fakedrop', this.onDocumentDetectDrop);
        document.removeEventListener('fakedragend', this.onDocumentDragEnd);
    }

    /**
     * When a fake drop is detected, via a mousedown or mousemove event, if the event target is the
     * current placeholder:
     *
     * - stop detecting document events
     * - firing `fakedragend` to tell all components that the drag and drop is finished
     * - call {@link module:Grid.Data.Actions.drop}
     *
     *
     * It does the same if a `fakedrop` event is triggered.
     *
     * @param  {event} event - The event that triggered this method
     */
    onDocumentDetectDrop(event) {
        if (Store.isDragging(this.getGridName()) && event.target === this.placeholderRef) {
            this.deactivateDropDetection();
            document.dispatchEvent(new Event('fakedragend'));
            Actions.drop(this.getGridName(), this.state.node);
        }
    }

    /**
     * When a drop operation is done, this method respond to the `fakedragend` event
     * to stop listening to event aimed to detect a drop
     *
     * @param  {event} event - The fakedragend event
     */
    onDocumentDragEnd(event) {
        this.deactivateDropDetection();
    }

    /**
     * Return the classes to use when rendering the current placeholder
     *
     * @return {String} - A string containing classes
     *
     * One or more of these classes:
     *
     * - `grid-cell`: in all cases
     * - `grid-cell-placeholder`: in all cases
     * - `grid-cell-placeholder-surround`: if the node as the `surround` attribute (placeholder that will
     *                                     use half it's grid content for the drag/drop module)
     * - `grid-cell-placeholder-prehovering`: if in "prehovering" mode, and it's the hovered placeholder
     *
     */
    getClasses() {
        const classes = {
            'grid-cell': true,
            'grid-cell-placeholder': true,
            'grid-cell-placeholder-surround': this.state.node.hasAttribute('surround')
        };
        classes['grid-cell-placeholder-prehovering'] = (
            this.getDesignModeStep() === 'prehovering'
            &&
            Store.isHoveringPlaceholder(this.getGridName(), this.state.node)
        );
        return classnames(classes);
    }

    /**
     * Render a simple div with classes defined by `getClasses`, and some events:
     *
     * - `onDragEnter`
     * - `onDragOver`
     * - `OnDragLeave`
     *
     * The `drop` event is managed on the document, by the grid itself
     */
    render() {
        return (
            <div
                className={this.getClasses()}
                ref={this.savePlaceholderRef}
                onDragEnter={this.onDragEnter}
                onDragOver={this.onDragOver}
                onDragLeave={this.onDragLeave}
            />
        );
    }


}

Placeholder.displayName = 'PlaceHolder';

export { Placeholder };
