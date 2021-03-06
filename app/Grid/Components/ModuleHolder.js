import React from 'react';

import { Actions, Store } from '../Data';

import { ModulesCache } from './Utils';
import { convertToNodesHolder } from './Hoc';


/**
 * This react component will hold a module in design mode, managing dragging, to
 * let the modules components strictly independent of the grid system.
 *
 * The hold module is not rendered as a child but detached/attached to this react
 * component dom node before/after mounting and updating, to avoid rerendering the
 * module at all costs. This is done by {@link module:Grid.Components.Hoc.convertToNodesHolder}
 *
 * @memberOf module:Grid.Components
 *
 * @summary A component to hold a module in design mode
 */
class BaseModuleHolder extends React.Component {

    constructor(props) {
        super(props);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.removeModule = this.removeModule.bind(this);

        this.saveModuleHolderRef = (ref) => { this.moduleHolderRef = ref; };
    }

    /**
     * Call {@link module:Grid.Data.Actions.startDragging} action when the drags of
     * the dom node starts.
     *
     * Before anything else, a class is added to the dom element to hide the delete
     * button on the "image" of the element that will be shown by the browser during
     * the drag
     *
     * @param  {event} event - The dragStart event
     */
    onDragStart(event) {
        // hack to hide the del button on the dragged view (rendered by the browser
        // before we can render the holder).
        // It's removed on the next update, via componentDidUpdate
        this.moduleHolderRef.classList.add('module-holder-browser-dragging');

        Actions.startDragging(this.props.gridName, this.props.gridCell);
        event.dataTransfer.setData('application/x-grid-module', this.props.gridName);
        event.dataTransfer.effectAllowed = 'move';
    }

    /**
     * Called when the dragged module leave this holder. It happens when the
     * placeholder is replaced by the holder after a certain amount of time
     * (when designModeStep goes from `prehovering` to `hovering)
     *
     * It calls {@link module:Grid.Data.Actions.stopHovering}
     *
     * @param  {event} event - The dragLeave event
     */
    onDragLeave(event) {
        // in case of fake drop, the dragleave event may occur just before, so w'ill wait a little
        setTimeout(() => {
            if (Store.getDesignModeStep(this.props.gridName) === 'hovering') {
                Actions.stopHovering(this.props.gridName);
            }
        }, BaseModuleHolder.dragLeaveTimeout);
    }

    /**
     * Called when the "delete" button is clicked, to call the actions asking the
     * Store to remove the cell linked to this holder
     */
    removeModule() {
        Actions.removeModule(this.props.gridName, this.props.gridCell);
    }

    /**
     * Return the attributes to use in the main div node in the render method
     *
     * Two special cases exist:
     *
     * - the design mode is "enabled",so we make the element draggable
     * - the element is currently dragged, so we activate the dragleave event
     *
     * These events are not activated if the grid is in one-screen mode
     *
     * @return {object} - A "dict" with the attributes
     */
    getRenderAttrs() {
        const attrs = {};

        if (!Store.isOneScreenMode(this.props.gridName)) {
            if (Store.getDesignModeStep(this.props.gridName) === 'enabled') {
                // design mode activated, we can activate dragging
                attrs.draggable = true;
                attrs.onDragStart = this.onDragStart;

            } else if (Store.isDraggingCell(this.props.gridName, this.props.gridCell)) {

                // we are in design mode, at least dragging, but as the placeholder
                // we'll hover will be replaced by the module holder, we'll have to
                // leave the holder to tell the store that we left the placeholder
                attrs.onDragLeave = this.onDragLeave;
            }
        }

        return attrs;
    }

    /**
     * Called just after an update, remove the class temporarily set in onDragStart,
     * as we now need to have the delete button displayed
     *
     * @param {object} prevProps - Component props before the update
     * @param {object} prevState - Component state before the update
     */
    componentDidUpdate(prevProps, prevState) {
        this.moduleHolderRef.classList.remove('module-holder-browser-dragging');
    }

    /**
     * Render the module holder, as a simple div with drag attributes/events, and
     * as a child, a div used as a cover over the module (attached via
     * {@link module:Grid.Components.Hoc.convertToNodesHolder}) to
     * drag the dom node without any risk of interacting with the module content.
     * This cover contain a "delete" button in design mode to delete the
     */
    render() {
        let delButton;
        if (Store.getDesignModeStep(this.props.gridName) === 'enabled' && !Store.isResizing(this.props.gridName)) {
            delButton = <button onClick={this.removeModule} title="Remove this module">X</button>;
        }
        return (
            <div
                className="module-holder"
                ref={this.saveModuleHolderRef}
                {...this.getRenderAttrs()}
            >
                <div className="module-cover">
                    {delButton}
                </div>
            </div>);
    }

}


BaseModuleHolder.displayName = 'ModuleHolder';

BaseModuleHolder.dragLeaveTimeout = 200;


/**
 * The type of node that can be attached to the current react component
 * dom node (managed by {@link module:Grid.Components.Hoc.convertToNodesHolder}):
 * - a module
 *
 * @type {Array}
 */
const externalNodesClassNames = [ModulesCache.moduleContainerClassName];

/**
 * Tell {@link module:Grid.Components.Hoc.convertToNodesHolder}
 * that this react component will always be able to hold a module.
 *
 * @return {boolean} - `true`
 */
const canHoldExternalNodes = wrappedComponent => true;

/**
 * Return the module to attach to the current react component dom node.
 *
 * It's take from the {@link module:Grid.Components.Utils.ModulesCache} module
 *
 * @param {XML} wrappedComponent - The component for which we want the node
 * @param  {String} className - The class name of the dom node to return
 * @return {Element|Node|XML} - The module dom node
 */
const getExternalNode = (wrappedComponent, className) => {
    if (className === ModulesCache.moduleContainerClassName) {
        return ModulesCache.getModuleComponent(null, wrappedComponent.props.uniqueKey);
    }
};

/**
 * {@link module:Grid.Components.BaseModuleHolder} extended with
 * {@link module:Grid.Components.Hoc.convertToNodesHolder}
 *
 * @memberOf module:Grid.Components
 *
 * @class
 *
*/
const ModuleHolder = convertToNodesHolder(
    BaseModuleHolder,
    externalNodesClassNames,
    canHoldExternalNodes,
    getExternalNode
);

ModuleHolder.dragLeaveTimeout = BaseModuleHolder.dragLeaveTimeout;

export { BaseModuleHolder, ModuleHolder };
