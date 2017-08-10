import React from 'react';
import classnames from 'classnames';

import { Actions } from '../Actions';
import { Store } from '../Store';

import { DocumentEventsMixin } from '../../Utils/ReactMixins/DocumentEvents';
import { GridMixin } from './Mixins/Grid';
import { NodeMixin } from './Mixins/Node';


/**
 * MainGrid component, composed of rows. Can enter/exit designMode
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The MainGrid component
 * @mixes module:Grid.Components.Mixins.Node
 * @mixes module:Grid.Components.Mixins.Grid
 */
let MainGrid = {

    displayName: 'MainGrid',

    mixins: [
        DocumentEventsMixin,
        NodeMixin,
        GridMixin
    ],

    dropDetectionActivationTimeout: 200,

    /**
     * When the component is created, set the gridName in the state based on the
     * grid from the props, to be able to update it later
     */
    getInitialState() {
        return {
            // we don't have `this.state.node` yet
            gridName: this.props.node.getAttribute('name')
        };
    },

    /**
     * When the component props are updated, set the gridName in the state based
     * on the grid from the new props, to be able to update it later
     */
    componentWillReceiveProps(nextProps) {
        const newName = nextProps.node.getAttribute('name');
        if (newName != this.state.gridName) {
            this.setState({
                gridName: newName
            });
        }
    },

    /**
     * Update the grid when a `grid.designMode` event is caught, only when the given name is the
     * one of the grid we have
     *
     * It is called on some events on the store after an update of a grid.
     *
     * On some events, some actions are done, related to dragging:
     *
     * - `grid.designMode.enter`: start listening to `dragover` and `drop` events on the document
     * - `grid.designMode.dragging.start`: activate fake drop detection
     * - `grid.designMode.dragging.stop` & `grid.designMode.drop`: stop fake drop detection and trigger `fakedragend`
     * - `grid.designMode.exit`: stop listening to `dragover` and `drop` events on the document
     *
     * @param {string} eventName - The name of the event that called this function (`grid.designMode.**`)
     * @param {string} gridName - The name of the grid for which the event was triggered
     */
    onDesignModeChange(eventName, gridName) {
        if (gridName != this.state.gridName) { return; }

        const actualGrid = Store.getGrid(this.state.gridName);

        if (actualGrid != this.state.node) {
            // if the grid is different, update the state, it will rerender
            this.setState({node: actualGrid});
        } else {
            // the grid is the same, but we still want a rerender, so we force it
            // except when a resizer is currently move, we choose to not update
            // the grid in this case and let the resizer apply the new flex values
            // to its previous and next sibling, for faster rendering
            if (eventName != 'grid.designMode.resizing.move') {
                this.forceUpdate();
            }
        }

        // do some specific action depending on the received event

        if (eventName == 'grid.designMode.enter' ) {
            // entering design mode, we start by now to listen do `dragover` and `drop` events on
            // the whole document

            this.addDocumentListener('dragover', 'onDocumentDragOver');
            this.addDocumentListener('drop', 'onDocumentDrop');

        } else if (eventName == 'grid.designMode.dragging.start' ) {
            // starting the drag operation, we start to detect a drop in case of the `drop` event
            // wouldn't have been be fired

            this.activateDropDetection();

        } else if (eventName == 'grid.designMode.dragging.stop' || eventName == 'grid.designMode.drop') {
            // ending the drag, or dropping (which is the same: the user stop holding the mouse button),
            // we stop trying to detect the drop, and tell the world whe drag is finished by triggering
            // a `fakedragend` event

            this.deactivateDropDetection();
            this.emitFakeDragEnd();


        } else if (eventName == 'grid.designMode.exit' ) {
            // exiting the design mode, we can stop listening to dragover and drop events

            this.removeDocumentListener('drop', 'onDocumentDrop');
            this.removeDocumentListener('dragover', 'onDocumentDragOver');
        }
    },

    /**
     * Add some event handlers on the document to try to detect that a drop occurend even if the
     * `drop` event was not fired by the browser, using the fact that mouse events are only
     * triggered when the drag and drop operation is finished.
     * The delay is needed in Firefox because a `mousemove` is triggered just after the `dragstart`
     *
     * So when a `mousemove` and `mousedown` event are listened, we consider that a drop is
     * detected. It works because we only start to listen to these events after the start of
     * the drag and drop operation, and stop to listen to them after the drop (real or detected).
     *
     * This method also listen for a `fakedragend` event, triggered when a drop operation is done.
     */
    activateDropDetection() {
        setTimeout(() => {
            this.addDocumentListener('mousemove', 'onDocumentDetectDrop');
            this.addDocumentListener('mousedown', 'onDocumentDetectDrop');
            this.addDocumentListener('fakedragend', 'onDocumentDragEnd');
        }, this.dropDetectionActivationTimeout);
    },

    /**
     * Stop listening to events defined in `activateDropDetection`
     */
    deactivateDropDetection() {
        this.removeDocumentListener('mousemove', 'onDocumentDetectDrop');
        this.removeDocumentListener('mousedown', 'onDocumentDetectDrop');
        this.removeDocumentListener('fakedragend', 'onDocumentDragEnd');
    },

    /**
     * When a drop operation is done, this method respond to the `fakedragend` event
     * to stop listening to event aimed to detect a drop
     *
     * @param  {event} event - The `fakedragend` event
     */
    onDocumentDragEnd() {
        this.deactivateDropDetection();
    },

    /**
     * When a fake drop is detected, via a mousedown or mousemove event:
     *
     * - if the event target is a placeholder, create a `fakedrop` event to be catched
     *   by the placeholder
     * - in all other cases, call `applyDrop`

     * @param  {event} event - The event that triggered this method
     */
    onDocumentDetectDrop(event) {
        if (Store.isDragging(this.state.gridName)) {
            if (event.target && event.target.classList && event.target.classList.contains('grid-cell-placeholder')) {
                this.emitFakeDrop(event.target);
            } else {
                this.applyDrop();
            }
        }
    },

    /**
     * Called when a real `drop` event is triggered anywhere on the document.
     *
     * The event propagation is stopped, then the `applyDrop` method is called
     * @param  {event} event - The `drop` event
     */
    onDocumentDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.applyDrop();
    },

    /**
     * Emit on fake drop event on the given placeholder node.
     *
     * It will be handled on the placeholder as a real drop on itself.
     *
     * @param  {DomNode} placeholderNode - The placeholder dom node
     */
    emitFakeDrop(placeholderNode) {
        const fakeDropEvent = new Event('fakedrop', {view: window, bubbles: true, target: placeholderNode });
        placeholderNode.dispatchEvent(fakeDropEvent);
    },

    /**
     * Emit a fake drag end event on the document, to tell the world that the whole
     * drag and drop operation is finished
     */
    emitFakeDragEnd() {
        document.dispatchEvent(new Event('fakedragend'));
    },

    /**
     * Called by `onDocumentDetectDrop` and `onDocumentDrop`, it will:
     *
     * - stop the drop detection
     * - tell the world that the drag is finish by triggering a `fakedragend` event
     * - apply the drop by calling {@link module:Grid.Actions.drop drop}
     */
    applyDrop() {
        this.deactivateDropDetection();
        this.emitFakeDragEnd();
        Actions.drop(this.state.gridName);
    },

    /**
     * Cancel the `dragover` event when received, to tell the browser that we
     * accept drops everywhere.
     *
     * @param  {event} event - The `dragover` event
     */
    onDocumentDragOver(event) {
        event.preventDefault();
    },

    /**
     * Called before attaching the component to the dom, to watch changes of the
     * store that impact the component
     */
    componentWillMount() {
        // hack to pass the original event to onDesignModeChange
        const self = this;
        this.__onDesignModeChange = this.__onDesignModeChange || function(gridName) {
            // `this` is the eventEmitter server, with `event`, the triggered event
            self.onDesignModeChange(this.event, gridName);
        };
        Store.on('grid.designMode.**', this.__onDesignModeChange);
    },

    /**
     * Called before detaching the component from the dom, to stop watching
     * changes of the store that impact the component
     */
    componentWillUnmount() {
        // this.__onDesignModeChange was defined in componentWillMount
        Store.off('grid.designMode.**', this.__onDesignModeChange);
        this.deactivateDropDetection();
    },

    /**
     * Enter or exit the design mode of the grid depending of its current status
     */
    toggleDesignMode() {
        if (this.isInDesignMode()) {
            Actions.exitDesignMode(this.state.gridName);
        } else {
            Actions.enterDesignMode(this.state.gridName);
        }
    },

    /**
     * Add a random module to the grid, with random content text.
     */
    addRandomModule() {
        const availableModules = [
            'Modules.Test1',
            'Modules.Test2'
        ];
        const randomModule = availableModules[Math.floor(availableModules.length * Math.random())];
        const modulesCount = Store.getGrid(this.state.gridName).querySelectorAll('cell[type=module]').length;
        const randomText = 'test.' + modulesCount;
        Actions.addModule(this.state.gridName, randomModule, {text: randomText});
    },

    /**
     * Ask the store to restore the previous version of the grid in its history
     */
    undo() {
        Actions.goBackInHistory(this.state.gridName);
    },

    /**
     * Ask the store to restore the next version of the grid in its history
     */
    redo() {
        Actions.goForwardInHistory(this.state.gridName);
    },

    /**
     * Return the classes to use when rendering the container of the current main grid
     *
     * @return {string} - A string containing classes
     *
     * One or more of these classes:
     *
     * - `grid-container`: in all cases
     * - `grid-container-design-mode`: if the grid is in design mode
     * - `grid-container-design-mode-step-*`: if the grid is in design mode, depending of the current step
     * - `grid-container-with-placeholders`: if the grid has placeholders
     * - `grid-container-with-resizers`: if the grid has resizers
     */
    getContainerClasses() {
        const inDesignMode = this.isInDesignMode();
        const classes = {
            'grid-container': true,
            'grid-container-design-mode': inDesignMode,
            'grid-container-with-placeholders': Store.hasPlaceholders(this.state.gridName),
            'grid-container-with-resizers': Store.hasResizers(this.state.gridName)
        };
        classes['grid-container-design-mode-step-' + this.getDesignModeStep()] = inDesignMode;
        return classnames(classes);
    },

    /**
     * Will render the component
     */
    render() {
        let addButton;
        let toggleButton;
        let undoButton;
        let redoButton;
        const designModeStep = this.getDesignModeStep();

        // manage the "Add a module" button
        if (designModeStep == 'enabled') {
            addButton = <button onClick={this.addRandomModule}>Add a random module</button>;
        }

        // manage the "enter/exit design mode" button
        if (designModeStep == 'enabled' || designModeStep == 'disabled') {
            toggleButton = (
                <button onClick={this.toggleDesignMode}>
                    {this.isInDesignMode() ? 'Exit' : 'Enter'} design mode
                </button>
            );
        }

        // manage the "undo" and "redo" buttons
        if (designModeStep == 'enabled') {
            undoButton = (
                <button onClick={this.undo} disabled={!Store.canGoBackInHistory(this.state.gridName)}>
                    Undo
                </button>
            );
            redoButton = (
                <button onClick={this.redo} disabled={!Store.canGoForwardInHistory(this.state.gridName)}>
                    Redo
                </button>
            );
        }

        return (<div className={this.getContainerClasses()}>
            <nav className="grid-toolbar">
                <label>{this.state.gridName}</label>
                {undoButton}{redoButton}{addButton}{toggleButton}
            </nav>
            {this.renderGrid()}
        </div>);
    }

};

MainGrid = React.createClass(MainGrid);

export { MainGrid };
