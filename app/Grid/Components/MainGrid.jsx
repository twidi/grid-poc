/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var DocumentEventsMixin = require('../../Utils/ReactMixins/DocumentEvents.jsx');
var GridMixin = require('./Mixins/Grid.jsx');
var NodeMixin = require('./Mixins/Node.jsx');


/**
 * MainGrid component, composed of rows. Can enter/exit designMode
 * @namespace
 * @memberOf module:Grid.Components
 * @summary The MainGrid component
 * @mixes module:Grid.Components.Mixins.Node
 * @mixes module:Grid.Components.Mixins.Grid
 */

var MainGrid = {
    mixins: [
        DocumentEventsMixin,
        NodeMixin,
        GridMixin,
    ],

    /**
     * When the component is created, set the gridName in the state based on the
     * grid from the props, to be able to update it later
     */
    getInitialState: function() {
        return {
            // we don't have `this.state.node` yet
            gridName: this.props.node.getAttribute('name'),
        };
    },

    /**
     * When the component props are updated, set the gridName in the state based
     * on the grid from the new props, to be able to update it later
     */
    componentWillReceiveProps: function(nextProps) {
        var newName = nextProps.node.getAttribute('name');
        if (newName != this.state.gridName) {
            this.setState({
                gridName: newName,
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
    onDesignModeChange: function (eventName, gridName) {
        if (gridName != this.state.gridName) { return; }

        var actualGrid = Store.getGrid(this.state.gridName);

        if (actualGrid != this.state.node) {
            // if the grid is different, update the state, it will rerender
            this.setState({node: actualGrid});
        } else {
            // the grid is the same, but we still want a rerender, so we forceit
            this.forceUpdate();
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
            document.dispatchEvent(new Event('fakedragend'));


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
     *
     * So when a `mousemove` and `mousedown` event are listened, we consider that a drop is
     * detected. It works because we only start to listen to these events after the start of
     * the drag and drop operation, and stop to listen to them after the drop (real or detected).
     *
     * This method also listen for a `fakedragend` event, triggered when a drop operation is done.
     */
    activateDropDetection: function() {
        this.addDocumentListener('mousemove', 'onDocumentDetectDrop');
        this.addDocumentListener('mousedown', 'onDocumentDetectDrop');
        this.addDocumentListener('fakedragend', 'onDocumentDragEnd');
    },

    /**
     * Stop listening to events defined in `activateDropDetection`
     */
    deactivateDropDetection: function() {
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
    onDocumentDragEnd: function(event) {
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
    onDocumentDetectDrop: function(event) {
        if (Store.isDragging(this.state.gridName)) {

            if (event.target.classList.contains('grid-cell-placeholder')) {
                var fakeDropEvent = new Event('fakedrop', {view: window, bubbles: true, target: event.target, });
                event.target.dispatchEvent(fakeDropEvent);
                return;
            }

            this.applyDrop();
        }
    },

    /**
     * Called when a real `drop` event is triggered anywhere on the document.
     *
     * The event propagation is stopped, then the `applyDrop` method is called
     * @param  {event} event - The `drop` event
     */
    onDocumentDrop: function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.applyDrop();
    },

    /**
     * Called by `onDocumentDetectDrop` and `onDocumentDrop`, it will:
     *
     * - stop the drop detection
     * - tell the world that the drag is finish by triggering a `fakedragend` event
     * - apply the drop by calling {@link module:Grid.Actions.drop drop}
     */
    applyDrop: function() {
        this.deactivateDropDetection();
        document.dispatchEvent(new Event('fakedragend'));
        Actions.drop(this.state.gridName);
    },

    /**
     * Cancel the `dragover` event when received, to tell the browser that we
     * accept drops everywhere.
     *
     * @param  {event} event - The `dragover` event
     */
    onDocumentDragOver: function(event) {
        event.preventDefault();
    },

    /**
     * Called before attaching the component to the dom, to watch changes of the
     * store that impact the component
     */
    componentWillMount: function () {
        // hack to pass the original event to onDesignModeChange
        var self = this;
        this.__onDesignModeChange = this.__onDesignModeChange || function(gridName) {
            // this is the eventEmitter server, with `event`, the triggered event
            self.onDesignModeChange(this.event, gridName);
        }
        Store.on('grid.designMode.**', this.__onDesignModeChange);
    },

    /**
     * Called before detaching the component from the dom, to stop watching
     * changes of the store that impact the component
     */
    componentWillUnmount: function () {
        // this.__onDesignModeChange was defined in componentWillMount
        Store.off('grid.designMode.**', this.__onDesignModeChange);
    },

    /**
     * Enter or exit the design mode of the grid depending of its current status
     */
    toggleDesignMode: function() {
        if (this.isInDesignMode()) {
            Actions.exitDesignMode(this.state.gridName);
        } else {
            Actions.enterDesignMode(this.state.gridName);
        }
    },

    /**
     * Return the classes to use when rendering the container of the current main grid
     *
     * @return {React.addons.classSet}
     *
     * One or more of these classes:
     *
     * - `grid-container`: in all cases
     * - `grid-container-design-mode`: if the grid is in design mode
     * - `grid-container-design-mode-step-*`: if the grid is in design mode, depending of the current step
     * - `grid-container-with-placeholders`: if the grid has placeholders
     */
    getContainerClasses: function() {
        var inDesignMode = this.isInDesignMode();
        var classes = {
            'grid-container': true,
            'grid-container-design-mode': inDesignMode,
            'grid-container-with-placeholders': Store.hasPlaceholders(this.getGridName()),
        };
        classes['grid-container-design-mode-step-' + this.getDesignModeStep()] = inDesignMode;
        return cx(classes);
    },

    /**
     * Will render the component
     */
    render: function() {
        return <div className={this.getContainerClasses()}>
            <nav className="grid-toolbar">
                <label>{this.state.gridName}</label>
                <button onClick={this.toggleDesignMode}>{this.isInDesignMode() ? "Exit" : "Enter"} design mode</button>
            </nav>
            {this.renderGrid()}
        </div>;
    }

};

module.exports = MainGrid = React.createClass(MainGrid);
