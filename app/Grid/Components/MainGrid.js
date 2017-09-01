import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import _ from 'lodash';
import Hammer from 'hammerjs';
import ReactResizeDetector from 'react-resize-detector';
import HammerComponent from 'react-hammerjs';

import { Actions, Store } from '../Data';

import { Grid } from './Bases';
import { activateMouseTrap } from '../../Utils/React/Hoc';
import { Exceptions as MousetrapExceptions } from '../../Utils/React/Hoc/Mousetrap';


/**
 * MainGrid component, composed of rows. Can manage designMode and navigate
 *
 * Enhanced by {@link module:Grid.Components.Hoc.convertToNodesHolder}
 *
 * @memberOf module:Grid.Components
 *
 * @summary The MainGrid component
 *
 * @extends module:Grid.Components.Bases.Grid
 */
class BaseMainGrid extends Grid {

    /**
     * When the component is created, start in "one screen" mode, and set the gridName in the
     * state based on the grid from the props, to be able to update it later.
     */
    constructor(props) {
        super(props);

        this.uuid = _.uniqueId();

        this.onDocumentDragOver = this.onDocumentDragOver.bind(this);
        this.onDocumentDrop = this.onDocumentDrop.bind(this);
        this.onDocumentDetectDrop = this.onDocumentDetectDrop.bind(this);
        this.onDocumentDragEnd = this.onDocumentDragEnd.bind(this);
        this.focusRightModuleCell = this.focusRightModuleCell.bind(this);
        this.focusLeftModuleCell = this.focusLeftModuleCell.bind(this);
        this.focusBottomModuleCell = this.focusBottomModuleCell.bind(this);
        this.focusTopModuleCell = this.focusTopModuleCell.bind(this);
        this.onResize = this.onResize.bind(this);
        this.onNavigateTo = this.onNavigateTo.bind(this);
        this.onPan = this.onPan.bind(this);
        this.onSwipe = this.onSwipe.bind(this);
        this.addRandomModule = this.addRandomModule.bind(this);
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
        this.toggleDesignMode = this.toggleDesignMode.bind(this);

        this.saveResizeDetectorRef = (ref) => { this.resizeDetectorRef = ref; };
        this.saveGridContainerRef = (ref) => { this.gridContainerRef = ref; };

        // this.state defined in GridNode, parent of Grid, parent of MainGrid
        this.state.gridName = props.node.getAttribute('name');
        this.state.oneScreenMode = props.screenMode !== BaseMainGrid.screenModes.multi;
        if (this.state.oneScreenMode) {
            Actions.enterOneScreenMode(this.state.gridName);
        }
    }

    /**
     * When the component props are updated, set the gridName in the state based
     * on the grid from the new props, to be able to update it later
     */
    componentWillReceiveProps(nextProps) {
        const newName = nextProps.node.getAttribute('name');
        if (newName !== this.state.gridName) {
            this.setState({
                gridName: newName
            });
        }
    }

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
     * @param {String} eventName - The name of the event that called this function (`grid.designMode.**`)
     * @param {String} gridName - The name of the grid for which the event was triggered
     */
    onDesignModeChange(eventName, gridName) {
        if (gridName !== this.state.gridName) { return; }

        const actualGrid = Store.getGrid(this.state.gridName);

        if (actualGrid !== this.state.node) {
            // if the grid is different, update the state, it will rerender
            this.setState({ node: actualGrid });
        } else if (eventName !== 'grid.designMode.resizing.move') {
            // the grid is the same, but we still want a rerender, so we force it
            // except when a resizer is currently move, we choose to not update
            // the grid in this case and let the resizer apply the new flex values
            // to its previous and next sibling, for faster rendering
            this.forceUpdate();
        }

        // do some specific action depending on the received event

        if (eventName === 'grid.designMode.enter') {

            // entering design mode, we start by now to listen do `dragover` and `drop` events on
            // the whole document

            this.addDocumentEventListener('dragover', this.onDocumentDragOver);
            this.addDocumentEventListener('drop', this.onDocumentDrop);

        } else if (eventName === 'grid.designMode.dragging.start') {
            // starting the drag operation, we start to detect a drop in case of the `drop` event
            // wouldn't have been be fired

            this.activateDropDetection();

        } else if (eventName === 'grid.designMode.dragging.stop' || eventName === 'grid.designMode.drop') {
            // ending the drag, or dropping (which is the same: the user stop holding the mouse button),
            // we stop trying to detect the drop, and tell the world whe drag is finished by triggering
            // a `fakedragend` event

            this.deactivateDropDetection();
            this.emitFakeDragEnd();


        } else if (eventName === 'grid.designMode.exit') {

            // exiting the design mode, we can stop listening to dragover and drop events

            this.removeDocumentListener('drop', this.onDocumentDrop);
            this.removeDocumentListener('dragover', this.onDocumentDragOver);
        }
    }

    addDocumentEventListener(eventName, callback) {
        document.addEventListener(eventName, callback);
    }

    removeDocumentListener(eventName, callback) {
        document.removeEventListener(eventName, callback);
    }

    /**
     * Add some event handlers on the document to try to detect that a drop occurred even if the
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
        if (this.dropDetectionActivated) { return; }
        this.dropDetectionActivated = true;
        setTimeout(() => {
            if (!this.dropDetectionActivated) { return; }
            this.addDocumentEventListener('mousemove', this.onDocumentDetectDrop);
            this.addDocumentEventListener('mousedown', this.onDocumentDetectDrop);
            this.addDocumentEventListener('fakedragend', this.onDocumentDragEnd);
        }, BaseMainGrid.dropDetectionActivationTimeout);
    }

    /**
     * Stop listening to events defined in `activateDropDetection`
     */
    deactivateDropDetection() {
        if (!this.dropDetectionActivated) { return; }
        this.dropDetectionActivated = false;
        this.removeDocumentListener('mousemove', this.onDocumentDetectDrop);
        this.removeDocumentListener('mousedown', this.onDocumentDetectDrop);
        this.removeDocumentListener('fakedragend', this.onDocumentDragEnd);
    }

    /**
     * When a drop operation is done, this method respond to the `fakedragend` event
     * to stop listening to event aimed to detect a drop
     *
     * @param  {event} event - The `fakedragend` event
     */
    onDocumentDragEnd(event) {
        this.deactivateDropDetection();
    }

    /**
     * When a fake drop is detected, via a mousedown or mousemove event:
     *
     * - if the event target is a placeholder, create a `fakedrop` event to be caught
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
    }

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
    }

    /**
     * Emit on fake drop event on the given placeholder node.
     *
     * It will be handled on the placeholder as a real drop on itself.
     *
     * @param  {Element|Node|XML} placeholderNode - The placeholder dom node
     */
    emitFakeDrop(placeholderNode) {
        const fakeDropEvent = new Event('fakedrop', { view: window, bubbles: true, target: placeholderNode });
        placeholderNode.dispatchEvent(fakeDropEvent);
    }

    /**
     * Emit a fake drag end event on the document, to tell the world that the whole
     * drag and drop operation is finished
     */
    emitFakeDragEnd() {
        document.dispatchEvent(new Event('fakedragend'));
    }

    /**
     * Called by `onDocumentDetectDrop` and `onDocumentDrop`, it will:
     *
     * - stop the drop detection
     * - tell the world that the drag is finish by triggering a `fakedragend` event
     * - apply the drop by calling {@link module:Grid.Data.Actions.drop}
     */
    applyDrop() {
        this.deactivateDropDetection();
        this.emitFakeDragEnd();
        Actions.drop(this.state.gridName);
    }

    /**
     * Cancel the `dragover` event when received, to tell the browser that we
     * accept drops everywhere.
     *
     * @param  {event} event - The `dragover` event
     */
    onDocumentDragOver(event) {
        event.preventDefault();
    }

    /**
     * Called just after attaching the component to the dom, to watch changes of the
     * store that impact the component
     */
    componentDidMount() {
        // hack to pass the original event to onDesignModeChange
        const self = this;
        this.__onDesignModeChange = this.__onDesignModeChange || function __onDesignModeChange(gridName) {
            // `this` is the eventEmitter server, with `event`, the triggered event
            self.onDesignModeChange(this.event, gridName);
        };
        Store.on('grid.designMode.**', this.__onDesignModeChange);
        this.activateGridNavigation();

        if (this.props.screenMode !== BaseMainGrid.screenModes.multi) {
            const [width, height] = this.resizeDetectorRef.containerSize();
            this.onResize(width, height);

            if (this.state.oneScreenMode) {
                this.configureHammer();
            }
        }
    }

    /**
     * Configure Hammer for swipe/pan if now in "one screen mode"
     *
     * @param {object} prevProps - Component props before the update
     * @param {object} prevState - Component state before the update
     */
    componentDidUpdate(prevProps, prevState) {
        if (this.props.screenMode !== BaseMainGrid.screenModes.multi
            &&
            !prevState.oneScreenMode
            &&
            this.state.oneScreenMode
        ) {
            this.configureHammer();
        }
    }

    /**
     * Called before detaching the component from the dom, to stop watching
     * changes of the store that impact the component
     */
    componentWillUnmount() {
        // this.__onDesignModeChange was defined in componentDidMount
        Store.off('grid.designMode.**', this.__onDesignModeChange);
        this.deactivateDropDetection();
        this.deactivateGridNavigation();
    }

    /**
     * Enter or exit the design mode of the grid depending of its current status
     */
    toggleDesignMode() {
        if (this.isInDesignMode()) {
            Actions.exitDesignMode(this.state.gridName);
        } else {
            Actions.enterDesignMode(this.state.gridName);
        }
    }

    /**
     * Add a random module to the grid, with random content text, then focus it.
     */
    addRandomModule() {
        const availableModules = [
            'Modules.Test1',
            'Modules.Test2'
        ];
        const randomModule = availableModules[Math.floor(availableModules.length * Math.random())];
        const modulesCount = Store.getGrid(this.state.gridName).querySelectorAll('cell[type=module]').length;
        const randomText = `test.${modulesCount}`;
        Actions.addModule(this.state.gridName, randomModule, { text: randomText });

        // if many add, each one will add a listener to `grid.designMode.module.add`, so
        // we save a uuid (in this, bound to the function) to compare it with the on
        // in the closure to only focus if it's the correct callback
        const uuid = _.uniqueId();
        let focusNewModuleCell = function focusNewModuleCell(gridName, newCellId) {
            if (this.uuid === uuid) {
                const grid = Store.getGrid(gridName);
                const newCell = grid.querySelector(`#${newCellId}`);
                if (newCell) {
                    Actions.focusModuleCell(gridName, newCell, false);
                }
            }
            Store.off('grid.designMode.module.add', focusNewModuleCell);
        };
        focusNewModuleCell = focusNewModuleCell.bind({
            component: this,
            uuid
        });

        Store.on('grid.designMode.module.add', focusNewModuleCell);
    }

    /**
     * Ask the store to restore the previous version of the grid in its history
     */
    undo() {
        Actions.goBackInHistory(this.state.gridName);
    }

    /**
     * Ask the store to restore the next version of the grid in its history
     */
    redo() {
        Actions.goForwardInHistory(this.state.gridName);
    }

    /**
     * Update grid style when focused
     *
     * @param  {String} gridName - The grid name for which the `focus.on` event is triggered
     */
    onNavigateTo(gridName) {
        if (gridName !== this.state.gridName) { return; }
        this.updateMainGridStyle();
    }

    /**
     * Ask the store to focus on the cell next to the right of the current focused one
     */
    focusRightModuleCell() {
        Actions.focusRightModuleCell(this.state.gridName, this.state.oneScreenMode);
    }

    /**
     * Ask the store to focus on the cell next to the left of the current focused one
     */
    focusLeftModuleCell() {
        Actions.focusLeftModuleCell(this.state.gridName, this.state.oneScreenMode);
    }

    /**
     * Ask the store to focus on the cell next to the bottom of the current focused one
     */
    focusBottomModuleCell() {
        Actions.focusBottomModuleCell(this.state.gridName);
    }

    /**
     * Ask the store to focus on the cell next to the top of the current focused one
     */
    focusTopModuleCell() {
        Actions.focusTopModuleCell(this.state.gridName);
    }

    /**
     * Called when a swipe was done to go from left or right module cell
     * Calls {@link module:Grid.Data.Actions.focusLeftModuleCell}
     * or {@link module:Grid.Data.Actions.focusRightModuleCell}
     *
     * @param  {event} event - The swipe event from Hammer
     */
    onSwipe(event) {
        let goToDirection;
        switch (event.direction) {
            case Hammer.DIRECTION_LEFT:
                goToDirection = 'Right';
                break;
            case Hammer.DIRECTION_RIGHT:
                goToDirection = 'Left';
                break;
            default:
                return;
        }
        if (this && this.panData) {
            this.panData.cancelled = true;
        }
        Actions[`focus${goToDirection}ModuleCell`](this.state.gridName, true);
    }

    /**
     * Called when a pan was done to go from left or right module cell.
     *
     * Calls {@link module:Grid.Data.Actions.focusLeftModuleCell}
     * or {@link module:Grid.Data.Actions.focusRightModuleCell}
     *
     * If on a boundary (called "overflow" here), make visually understandable that there is no
     * module cell on the left/right.
     *
     * @param  {event} event - The pan event from Hammer
     */
    onPan(event) {
        let deltaX;
        switch (event.eventType) {
            case Hammer.INPUT_START:
                break;

            case Hammer.INPUT_MOVE:
                if (!this.panData) {
                    const gridContainer = ReactDOM.findDOMNode(this.gridContainerRef);
                    this.panData = {
                        gridContainer,

                        gridWidth: gridContainer.firstChild.offsetWidth,
                        bodyWidth: document.body.offsetWidth,

                        cancelled: false,

                        overflow: {
                            delta: 0,

                            left: {
                                blocked: false,
                                node: gridContainer.children[1],
                                delta: null,
                                offTimer: null
                            },

                            right: {
                                blocked: false,
                                node: gridContainer.children[2],
                                delta: null,
                                offTimer: null
                            }
                        },

                        activateOverflow(side, delta) {
                            const data = this.overflow[side];
                            if (data.offTimer) {
                                clearTimeout(data.offTimer);
                                data.offTimer = null;
                            }
                            this.overflow.delta = delta;
                            data.blocked = true;
                            const newDelta = Math.round(Math.sqrt(Math.abs(delta % this.bodyWidth)) * 2);
                            if (newDelta !== data.delta) {
                                data.node.classList.remove('going-off');
                                data.node.classList.add('on');
                                data.node.style.transform = `translateX(${side === 'right' ? '-' : ''}${newDelta}px)`;
                                data.node.style.opacity = 0.5 + ((1 - Math.exp(-0.00001 * (delta ** 2))) / 2);
                                data.delta = newDelta;
                            }
                        },

                        deactivateOverflow(side) {
                            const data = this.overflow[side];
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
                                data.offTimer = setTimeout(() => {
                                    data.offTimer = null;
                                    data.node.classList.remove('on');
                                    data.node.classList.remove('going-off');
                                }, 200);
                            }
                        }
                    };

                    this.panData.nbCards = Math.round(this.panData.gridWidth / this.panData.bodyWidth);
                }

                deltaX = event.deltaX - this.panData.overflow.delta;

                const index = Store.getFocusedModuleCellIndex(this.state.gridName);

                const canScrollLeft = (index * this.panData.bodyWidth) - deltaX > 0;
                const canScrollRight = ((index + 1) * this.panData.bodyWidth) - deltaX < this.panData.gridWidth - 1;

                if (deltaX >= 0 && !canScrollLeft) {
                    if (!this.panData.overflow.left.blocked) {
                        this.updateMainGridStyle(`${index * this.panData.bodyWidth}px`);
                    }
                    this.panData.activateOverflow('left', event.deltaX);
                } else if (deltaX <= 0 && !canScrollRight) {
                    if (!this.panData.overflow.right.blocked) {
                        this.updateMainGridStyle(`${((index - this.panData.nbCards) + 1) * 100}vw`);
                    }
                    this.panData.activateOverflow('right', event.deltaX);
                } else {
                    this.panData.deactivateOverflow('left');
                    this.panData.deactivateOverflow('right');
                    this.updateMainGridStyle(`${deltaX}px`);
                }
                break;

            case Hammer.INPUT_END:
            case Hammer.INPUT_CANCEL:
                if (!this.panData) {
                    break;
                }

                const panData = this.panData;
                delete this.panData;

                panData.deactivateOverflow('left');
                panData.deactivateOverflow('right');

                let cancelPan = true;

                if (event.eventType === Hammer.INPUT_END && !panData.cancelled) {
                    deltaX = event.deltaX - panData.overflow.delta;

                    if (Math.abs(deltaX) > panData.bodyWidth / 2) {
                        const goToDirection = deltaX < 0 ? 'Right' : 'Left';
                        cancelPan = false;
                        Actions[`focus${goToDirection}ModuleCell`](this.state.gridName, true);
                    }
                }

                if (cancelPan) {
                    this.updateMainGridStyle();
                }

                break;

        }
    }

    /**
     * Configure Hammer to react on swipe/pan events
     */
    configureHammer() {
        const hammer = this.gridContainerRef.hammer;
        hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
        hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL })).recognizeWith(hammer.get('swipe'));
        hammer.on('pan', this.onPan);
    }

    /**
     * Activate the keyboard shortcuts to enable keyboard navigation between
     * module cells
     */
    activateGridNavigation() {
        this.props.bindShortcut('ctrl+right', this.focusRightModuleCell);
        this.props.bindShortcut('ctrl+left', this.focusLeftModuleCell);
        this.props.bindShortcut('ctrl+down', this.focusBottomModuleCell);
        this.props.bindShortcut('ctrl+up', this.focusTopModuleCell);

        Store.on('grid.navigate.focus.on', this.onNavigateTo);
    }

    /**
     * Deactivate the keyboard shortcuts to disable keyboard navigation between
     * module cells
     */
    deactivateGridNavigation() {
        try {
            this.props.unbindShortcut('ctrl+right');
            this.props.unbindShortcut('ctrl+left');
            this.props.unbindShortcut('ctrl+down');
            this.props.unbindShortcut('ctrl+up');
        } catch (e) {
            if (e instanceof MousetrapExceptions.Inconsistency) {
                // We silently ignore this exception. It may happen if the
                // `unbindAllShortcuts` of the Mousetrap HOC was called just
                // before
            } else {
                // other cases, throw the original exception
                throw (e);
            }
        }

        Store.off('grid.navigate.focus.on', this.onNavigateTo);
    }

    /**
     * Return the classes to use when rendering the container of the current main grid
     *
     * @return {String} - A string containing classes
     *
     * One or more of these classes:
     *
     * - `grid-component`: in all cases
     * - `grid-component-one-screen-mode`: in the grid is in "one screen" mode
     * - `grid-component-design-mode`: if the grid is in design mode
     * - `grid-component-design-mode-step-*`: if the grid is in design mode, depending of the current step
     * - `grid-component-with-placeholders`: if the grid has placeholders
     * - `grid-component-with-resizers`: if the grid has resizers
     */
    getComponentClasses() {
        const inDesignMode = this.isInDesignMode();
        const classes = {
            'grid-component': true,
            'grid-component-one-screen-mode': this.state.oneScreenMode,
            'grid-component-design-mode': inDesignMode,
            'grid-component-with-placeholders': Store.hasPlaceholders(this.state.gridName),
            'grid-component-with-resizers': Store.hasResizers(this.state.gridName)
        };
        classes[`grid-component-design-mode-step-${this.getDesignModeStep()}`] = inDesignMode;
        return classnames(classes);
    }

    /**
     * Update the style of the grid dom node, to translate it horizontally in "one screen" mode.
     *
     * @param {String} [deltaX=] - The delta, with its unit, to translate horizontally (passed to `getMainGridStyle`)
     */
    updateMainGridStyle(deltaX) {
        const domNode = ReactDOM.findDOMNode(this);

        if (this.state.oneScreenMode) {
            const container = domNode.querySelector('.grid-container');
            container.scrollLeft = 0;
        }

        const gridNode = domNode.querySelector('.grid-main');
        const styles = this.getMainGridStyle(deltaX);
        _.forOwn(styles, (style, name) => {
            gridNode.style[name] = style;
        });

        if (this.state.oneScreenMode) {
            setTimeout(() => {
                // focusing the cell may have change the horizontal scroll of the grid container
                // so we reset it to 0 a little bit after
                const container = domNode.querySelector('.grid-container');
                container.scrollLeft = 0;
            }, 1);
        }
    }

    /**
     * Compute the style for the grid dom node in "one screen" mode. Reset the style if not in this screen mode.
     *
     * @param {String} [deltaX=] - The delta, with its unit, to translate horizontally (passed to `getMainGridStyle`)
     *
     * @returns {object} - The style properties to apply to the grid
     */
    getMainGridStyle(deltaX) {
        if (!this.state.oneScreenMode) {
            return {
                transform: null,
                transition: null
            };
        }

        const index = Store.getFocusedModuleCellIndex(this.state.gridName);
        let delta = index ? `-${index * 100}vw` : '0px';
        const deltaXSet = (typeof deltaX !== 'undefined');
        if (deltaXSet) {
            if (deltaX && parseInt(deltaX, 10)) {
                delta = index ? `calc(${delta} + ${deltaX})` : deltaX;
            }
        }
        return {
            transform: `translateX(${delta})`,
            // force no transition if deltaX given, else use the one defined in css file
            transition: deltaXSet ? 'none' : null
        };
    }

    /**
     * Called when the grid size change, to change the screen mode if allowed by `this.props.screenMode`)
     *
     * @param {int} width - The new width of the grid
     * @param {int} height - The new height of the grid
     */
    onResize(width, height) {
        let oneScreenMode;
        switch (this.props.screenMode) {
            case BaseMainGrid.screenModes.one:
                oneScreenMode = true;
                break;
            case BaseMainGrid.screenModes.multi:
                oneScreenMode = false;
                break;
            default:
                oneScreenMode = (
                    width < this.props.oneScreenWidthThreshold || height < this.props.oneScreenHeightThreshold
                );
        }
        if (oneScreenMode !== this.state.oneScreenMode) {
            Actions[oneScreenMode ? 'enterOneScreenMode' : 'exitOneScreenMode'](this.state.gridName);
            this.setState({ oneScreenMode });
        }
    }

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
        if (designModeStep === 'enabled') {
            addButton = <button onClick={this.addRandomModule} key="addButton">Add a random module</button>;
        }

        // manage the "enter/exit design mode" button
        if (designModeStep === 'enabled' || designModeStep === 'disabled') {
            toggleButton = (
                <button onClick={this.toggleDesignMode} key="toggleButton">
                    {this.isInDesignMode() ? 'Exit' : 'Enter'} design mode
                </button>
            );
        }

        // manage the "undo" and "redo" buttons
        if (designModeStep === 'enabled') {
            undoButton = (
                <button
                    onClick={this.undo}
                    disabled={!Store.canGoBackInHistory(this.state.gridName)}
                    key="undoButton"
                >
                    Undo
                </button>
            );
            redoButton = (
                <button
                    onClick={this.redo}
                    disabled={!Store.canGoForwardInHistory(this.state.gridName)}
                    key="redoButton"
                >
                    Redo
                </button>
            );
        }

        let navBarSideMenu = [];
        let containerChildren = [this.renderGrid({}, this.getMainGridStyle())];

        if (this.state.oneScreenMode) {
            const menuButtonId = `menu-button-${this.uuid}`;
            navBarSideMenu = [
                <input type="checkbox" id={menuButtonId} key="menuButton" />,
                <label className="menu-button" key="menuButtonLabel" htmlFor={menuButtonId}>Menu</label>
            ];
            containerChildren = (
                <HammerComponent onSwipe={this.onSwipe} ref={this.saveGridContainerRef}>
                    <div className="grid-container">
                        {containerChildren}
                        <div className="grid-container-scroll-overflow-left" />
                        <div className="grid-container-scroll-overflow-right" />
                    </div>
                </HammerComponent>
            );
        }


        return (<div className={this.getComponentClasses()}>
            <nav className="grid-toolbar">
                {this.state.oneScreenMode && navBarSideMenu}
                <h1>{this.state.gridName}</h1>
                <div className="buttons">{undoButton}{redoButton}{addButton}{toggleButton}</div>
            </nav>
            {containerChildren}
            {
                this.props.screenMode !== BaseMainGrid.screenModes.multi
                &&
                <ReactResizeDetector
                    handleWidth
                    handleHeight
                    onResize={this.onResize}
                    ref={this.saveResizeDetectorRef}
                />
            }
        </div>);
    }

}

BaseMainGrid.displayName = 'MainGrid';

/**
 * Delay after drag start to wait before activating drop detection
 * @type {int}
 *
 */
BaseMainGrid.dropDetectionActivationTimeout = 200;

/**
 * Available modes for the `screenMode` props of MainGrid component
 *
 * @property one - Force to always be in "one screen" mode, with swipe to change active module cell
 * @property multi - Force to always be in "full grid" mode
 * @property default - Use `one` mode in small screens, and `multi` mode otherwise
 */
BaseMainGrid.screenModes = {
    one: true,
    multi: false,
    default: null
};

/**
 * Component props
 *
 * @property {Boolean} screenMode - Define the screen mode behavior of the grid
 *                                 (one of {@link module:Grid.Components.MainGrid.screenModes}).
 *                                 Default to `screenMode.default`.
 * @property {int} oneScreenWidthThreshold - Define the width of the grid below which it goes
 *                                           in "one screen" mode if `screenMode` allows it. Default to `1024`.
 * @property {int} oneScreenHeightThreshold - Define the height of the grid below which it goes
 *                                            in "one screen" mode if `screenMode` allows it. Default to `768`.
 *
 */
BaseMainGrid.propTypes = {
    screenMode: PropTypes.bool,
    oneScreenWidthThreshold: PropTypes.number,
    oneScreenHeightThreshold: PropTypes.number
};

/**
 * Define component props and their default values
 */
BaseMainGrid.defaultProps = {
    screenMode: BaseMainGrid.screenModes.default,
    oneScreenWidthThreshold: 1024,
    oneScreenHeightThreshold: 768
};


/**
 * {@link module:Grid.Components.BaseMainGrid} extended with
 * {@link module:Utils.React.Hoc.activateMouseTrap}
 *
 * @memberOf module:Grid.Components
 *
 * @class
 *
*/
const MainGrid = activateMouseTrap(BaseMainGrid);

MainGrid.dropDetectionActivationTimeout = BaseMainGrid.dropDetectionActivationTimeout;
MainGrid.screenModes = BaseMainGrid.screenModes;


export { BaseMainGrid, MainGrid };
