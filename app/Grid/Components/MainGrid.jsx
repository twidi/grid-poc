/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;
var Hammer = require('hammerjs');

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var DocumentEventsMixin = require('../../Utils/ReactMixins/DocumentEvents.jsx');
var HammerComponent = require('../../Utils/ReactMixins/Hammer.jsx');
var MousetrapMixin = require('../../Utils/ReactMixins/Mousetrap.jsx');

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
        MousetrapMixin,
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

            this.deactivateGridNavigation()

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

            this.activateGridNavigation()

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
    onDocumentDrop: function(event) {
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
    emitFakeDrop: function(placeholderNode) {
        var fakeDropEvent = new Event('fakedrop', {view: window, bubbles: true, target: placeholderNode, });
        placeholderNode.dispatchEvent(fakeDropEvent);
    },

    /**
     * Emit a fake drag end event on the document, to tell the world that the whole
     * drag and drop operation is finished
     */
    emitFakeDragEnd: function() {
        document.dispatchEvent(new Event('fakedragend'));
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
        this.emitFakeDragEnd();
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
     * Called just after attaching the component to the dom, to watch changes of the
     * store that impact the component
     */
    componentDidMount: function () {
        console.log('in compo');
        // hack to pass the original event to onDesignModeChange
        var self = this;
        this.__onDesignModeChange = this.__onDesignModeChange || function(gridName) {
            // `this` is the eventEmitter server, with `event`, the triggered event
            self.onDesignModeChange(this.event, gridName);
        }
        Store.on('grid.designMode.**', this.__onDesignModeChange);
        this.activateGridNavigation();
        this.configurePan();
    },

    /**
     * Called before detaching the component from the dom, to stop watching
     * changes of the store that impact the component
     *
     * We don't call `deactivateGridNavigation` because the clean 
     */
    componentWillUnmount: function () {
        // this.__onDesignModeChange was defined in componentDidMount
        Store.off('grid.designMode.**', this.__onDesignModeChange);
        this.deactivateDropDetection();
        this.deactivateGridNavigation()
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
     * Add a random module to the grid, with random content text.
     */
    addRandomModule: function() {
        var availableModules = [
            'Modules.Test1',
            'Modules.Test2',
        ];
        var randomModule = availableModules[Math.floor(availableModules.length * Math.random())];
        var modulesCount = Store.getGrid(this.state.gridName).querySelectorAll('cell[type=module]').length;
        var randomText = 'test.' + modulesCount;
        Actions.addModule(this.state.gridName, randomModule, {text: randomText});
    },

    /**
     * Ask the store to restore the previous version of the grid in its history
     */
    undo: function() {
        Actions.goBackInHistory(this.state.gridName);
    },

    /**
     * Ask the store to restore the next version of the grid in its history
     */
    redo: function() {
        Actions.goForwardInHistory(this.state.gridName);
    },

    onNavigateTo: function(gridName) {
        if (gridName != this.state.gridName) { return; }
        this.updateMainGridStyle();
    },

    /**
     * Ask the store to focus on the cell next to the right of the current focused one
     */
    focusRightModuleCell: function() {
        Actions.focusRightModuleCell(this.state.gridName);
    },

    /**
     * Ask the store to focus on the cell next to the left of the current focused one
     */
    focusLeftModuleCell: function() {
        Actions.focusLeftModuleCell(this.state.gridName);
    },

    /**
     * Ask the store to focus on the cell next to the bottom of the current focused one
     */
    focusBottomModuleCell: function() {
        Actions.focusBottomModuleCell(this.state.gridName);
    },

    /**
     * Ask the store to focus on the cell next to the top of the current focused one
     */
    focusTopModuleCell: function() {
        Actions.focusTopModuleCell(this.state.gridName);
    },

    onSwipe: function(event) {
        console.log(event);
        var goToDirection;
        switch(event.direction) {
            case Hammer.DIRECTION_LEFT:
                goToDirection = 'Right';
                break;
            case Hammer.DIRECTION_RIGHT:
                goToDirection = 'Left';
                break;
            default:
                return;
        }
        console.log('SWIPE from ', goToDirection);
        if (this.panData) {
            this.panData.cancelled = true;
        }
        Actions['focus' + goToDirection + 'ModuleCell'](this.state.gridName, true);
    },

    onPan: function(event) {
        switch(event.eventType) {
            case Hammer.INPUT_START:
                console.log('START');
                break;

            case Hammer.INPUT_MOVE:
                console.log('PAN MOVE');
                if (!this.panData) {
                    var gridContainer = this.refs.gridContainer.getDOMNode();
                    this.panData = {
                        gridContainer: gridContainer,
                        gridContainerIdSet: false,

                        gridWidth: gridContainer.firstChild.offsetWidth,
                        bodyWidth: document.body.offsetWidth,

                        cancelled: false,

                        overflow: {
                            delta: 0,

                            left: {
                                blocked: false,
                                node: gridContainer.children[1],
                                delta: null,
                                offTimer: null,
                            },

                            right: {
                                blocked: false,
                                node: gridContainer.children[2],
                                delta: null,
                                offTimer: null,
                            },
                        },

                        activateOverflow: function(side, delta) {
                            var data = this.overflow[side];
                            if (data.offTimer) {
                                clearTimeout(data.offTimer);
                                data.offTimer = null;
                            }
                            this.overflow.delta = delta;
                            data.blocked = true;
                            var newDelta = Math.round(Math.sqrt(Math.abs(delta % this.bodyWidth)) * 2);
                            if (newDelta != data.delta) {
                                data.node.classList.remove('going-off');
                                data.node.classList.add('on');
                                data.node.style.transform = 'translateX(' + (side == 'right' ? '-' : '') + newDelta + 'px)';
                                data.node.style.opacity = 0.5 + (1-Math.exp(-0.00001 * Math.pow(delta, 2)))/2;
                                data.delta = newDelta;
                            }
                        },

                        deactivateOverflow: function(side) {
                            var data = this.overflow[side];
                            if (!data.blocked) { return; }
                            if (data.offTimer) {
                                clearTimeout(data.offTimer);
                                data.offTimer = null;
                            }
                            data.blocked = false;
                            data.delta = null;
                            if (data.node.classList.contains('on')) {
                                data.node.classList.add('going-off');
                                data.node.style.transform = '';
                                data.node.style.opacity = '';
                                data.offTimer = setTimeout(function() {
                                    data.offTimer = null;
                                    data.node.classList.remove('on');
                                    data.node.classList.remove('going-off');
                                }, 200);
                            }
                        },
                    };

                    var gridContainerId = gridContainer.getAttribute('id');
                    if (!gridContainerId) {
                        gridContainerId = _.uniqueId('gridContainer');
                        gridContainer.setAttribute('id', gridContainerId);
                        this.panData.gridContainerIdSet = true;
                    }
                    this.panData.gridContainerId = gridContainerId;
                    this.panData.nbCards = Math.round(this.panData.gridWidth / this.panData.bodyWidth);
                }

                var deltaX = event.deltaX - this.panData.overflow.delta;

                var index = Store.getFocusedModuleCellIndex(this.state.gridName);

                var canScrollLeft = (index * this.panData.bodyWidth - deltaX > 0);
                var canScrollRight = ((index + 1) * this.panData.bodyWidth - deltaX < this.panData.gridWidth -1);

                if (deltaX >= 0 && !canScrollLeft) {
                    if (!this.panData.overflow.left.blocked) {
                        this.updateMainGridStyle(index * this.panData.bodyWidth + 'px');
                    }
                    this.panData.activateOverflow('left', event.deltaX);
                } else if (deltaX <= 0 && !canScrollRight) {
                    if (!this.panData.overflow.right.blocked) {
                        this.updateMainGridStyle((index - this.panData.nbCards + 1)*100 + 'vw');
                    }
                    this.panData.activateOverflow('right', event.deltaX);
                } else {
                    this.panData.deactivateOverflow('left');
                    this.panData.deactivateOverflow('right');
                    this.updateMainGridStyle(deltaX + 'px');
                }
                break;

            case Hammer.INPUT_END:
                console.log('PAN END');
            case Hammer.INPUT_CANCEL:
                if (!this.panData) {
                    break;
                }
                if (event.eventType == Hammer.INPUT_CANCEL || this.panData.cancelled) { console.log('PAN CANCEL',  this.panData.cancelled); }

                var panData = this.panData;
                delete this.panData;

                panData.deactivateOverflow('left');
                panData.deactivateOverflow('right');

                var cancelPan = true;

                if (event.eventType == Hammer.INPUT_END && !panData.cancelled) {
                    var deltaX = event.deltaX - panData.overflow.delta;

                    if (Math.abs(deltaX) > document.body.offsetWidth / 2) {
                        var goToDirection = deltaX < 0 ? 'Right' : 'Left';
                        cancelPan = false;
                        Actions['focus' + goToDirection + 'ModuleCell'](this.state.gridName, true);
                    }
                }

                if (cancelPan) {
                    this.updateMainGridStyle();
                }

                break;

        }
    },

    configurePan: function() {
        var hammer = this.refs.gridContainer.hammer;
        hammer.get('swipe').set({direction: Hammer.DIRECTION_HORIZONTAL});
        hammer.add(new Hammer.Pan({direction: Hammer.DIRECTION_HORIZONTAL})).recognizeWith(hammer.get('swipe'));
        hammer.on('pan', this.onPan);
    },

    /**
     * Activate the keyboard shortcuts to enable keyboard navigation between
     * module cells
     */
    activateGridNavigation: function() {
        this.bindShortcut('ctrl+right', this.focusRightModuleCell);
        this.bindShortcut('ctrl+left', this.focusLeftModuleCell);
        this.bindShortcut('ctrl+down', this.focusBottomModuleCell);
        this.bindShortcut('ctrl+up', this.focusTopModuleCell);

        Store.on('grid.navigate.focus.on', this.onNavigateTo);
    },

    /**
     * Deactivate the keyboard shortcuts to disaable keyboard navigation between
     * module cells
     */
    deactivateGridNavigation: function() {
        try {
            this.unbindShortcut('ctrl+right');
            this.unbindShortcut('ctrl+left');
            this.unbindShortcut('ctrl+down');
            this.unbindShortcut('ctrl+up');
        } catch (e) {
            if (e instanceof MousetrapMixin.statics.Exceptions.Inconsistency) {
                // We silently ignore this exception. It may happen if the
                // `unbindAllShortcuts` of the MousetrapMixin was called just
                // before
            } else {
                // other cases, throw the original exception
                throw(e);
            }
        }

        Store.off('grid.navigate.focus.on', this.onNavigateTo);
    },

    /**
     * Return the classes to use when rendering the container of the current main grid
     *
     * @return {React.addons.classSet}
     *
     * One or more of these classes:
     *
     * - `grid-component`: in all cases
     * - `grid-component-design-mode`: if the grid is in design mode
     * - `grid-component-design-mode-step-*`: if the grid is in design mode, depending of the current step
     * - `grid-component-with-placeholders`: if the grid has placeholders
     * - `grid-component-with-resizers`: if the grid has resizers
     */
    getComponentClasses: function() {
        var inDesignMode = this.isInDesignMode();
        var classes = {
            'grid-component': true,
            'grid-component-design-mode': inDesignMode,
            'grid-component-with-placeholders': Store.hasPlaceholders(this.state.gridName),
            'grid-component-with-resizers': Store.hasResizers(this.state.gridName),
        };
        classes['grid-component-design-mode-step-' + this.getDesignModeStep()] = inDesignMode;
        return cx(classes);
    },

    updateMainGridStyle: function(adjustWidth) {
        var domNode = this.getDOMNode();

        var container = domNode.querySelector('.grid-container');
        container.scrollLeft = 0;

        var gridNode = domNode.querySelector('.grid-main');
        var styles = this.getMainGridStyle(adjustWidth);
        for (var name in styles) {
            gridNode.style[name] = styles[name];
        }
    },

    getMainGridStyle: function(adjustWidth) {
        var index = Store.getFocusedModuleCellIndex(this.state.gridName);
        delta =  '-' + (index * 100) + 'vw';
        var adjustWidthSet = (typeof adjustWidth != 'undefined');
        if (adjustWidthSet) {
            delta = 'calc(' + delta + ' + ' + adjustWidth + ')';
        }
        return {
            transform: 'translateX(' + delta + ')',
            transition: adjustWidthSet ? 'none' : '',
        };
    },

    /**
     * Will render the component
     */
    render: function() {
        var addButton, toggleButton, undoButton, redoButton;
        var designModeStep = this.getDesignModeStep();

        // manage the "Add a module" button
        if (designModeStep == 'enabled') {
            addButton = <button onClick={this.addRandomModule} key='addButton'>Add a random module</button>
        }

        // manage the "enter/exit design mode" button
        if (designModeStep == 'enabled' || designModeStep == 'disabled') {
            toggleButton = <button onClick={this.toggleDesignMode} key='toggleButton'>{this.isInDesignMode() ? "Exit" : "Enter"} design mode</button>;
        }

        // manage the "undo" and "redo" buttons
        if (designModeStep == 'enabled') {
            undoButton = <button onClick={this.undo} disabled={!Store.canGoBackInHistory(this.state.gridName)} key='undoButton'>Undo</button>;
            redoButton = <button onClick={this.redo} disabled={!Store.canGoForwardInHistory(this.state.gridName)} key='redoButton'>Redo</button>;
        }

        var buttons = [undoButton, redoButton, addButton, toggleButton];

        var containerChildren = [this.renderGrid({}, this.getMainGridStyle())];

        var containerSmallAttrs = {}

        if (true) {  // if media query
            containerChildren.push(<div className="grid-container-scroll-overflow-left" />);
            containerChildren.push(<div className="grid-container-scroll-overflow-right" />);
            containerSmallAttrs.onSwipe = this.onSwipe;
        }

        return <div className={this.getComponentClasses()}>
            <nav className="grid-toolbar">
                <label>{this.state.gridName}</label>
                {buttons}
            </nav>
            <HammerComponent component="div" className="grid-container" ref="gridContainer" {...containerSmallAttrs}>
                {containerChildren}
            </HammerComponent>
        </div>;
    }

};

module.exports = MainGrid = React.createClass(MainGrid);
