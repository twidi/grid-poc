/** @jsx React.DOM */
var _ = require('lodash');
var React = require('react/addons');  // react + addons
var cx = React.addons.classSet;

var Actions = require('../Actions.js');
var Store = require('../Store.js');

var ModulesCache = require('./ModulesCache.js');

var ModuleHolder = require('./ModuleHolder.jsx')
var Placeholder = require('./Placeholder.jsx');

var DocumentEventsMixin = require('../../Utils/ReactMixins/DocumentEvents.jsx');
var NodesHolderMixin = require('./Mixins/NodesHolder.jsx');
var NodeMixin = require('./Mixins/Node.jsx');


/**
 * Cell component, a cell of a row. Can be a "grid" or a "module"
 *
 * This react component has a special behavior when its type is "module": in this
 * case it will have no react child at all, but they will be attached by
 * {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin},
 * ie detaching/attaching the child before/after mounting/updating, and the child
 * will be rendered in its own react root.
 *
 * In design mode, the child will be a {@link module:Grid.Components.ModuleHolder ModuleHolder}
 * component, used as a base to drag the module on the grid. It's separated from
 * the cell because the cell will be removed in drag mode, and the dragged object
 * must exists in the dom for a proper drag and drop process.
 *
 * In non-design mode, the child will be a module component. It's separated from
 * the cell to avoid, at all cost, triggering a rendering when the grid is updated,
 * beacause modules can be heavy (in design mode, it's the module holder that
 * hold the module, the same way)
 *
 * The module holders node, and the modules ones, are managed by the
 * {@link module:Grid.Components.ModulesCache ModulesCache} module
 *
 * @namespace
 *
 * @memberOf module:Grid.Components
 *
 * @summary The Cell component, a cell of a row
 *
 * @mixes module:Grid.Components.Mixins.Node
 * @mixes module:Grid.Components.Mixins.NodesHolder
 */
var Cell = {

    mixins: [
        DocumentEventsMixin,
        NodeMixin,
        NodesHolderMixin,
    ],


    /**
     * Two types of nodes that can be attached to the current react component
     * dom node (managed by {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}):
     * - a module
     * - a {@link module:Grid.Components.ModuleHolder module holder}
     *
     * Only one on them will be attached at a moment. See `getExternalNode` to
     * see in which conditions.
     *
     * @type {Array}
     */
    externalNodesClassNames: [
        ModulesCache.moduleContainerClassName,
        ModulesCache.holderContainerClassName,
    ],


    /**
     * Tell {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}
     * that we only want to handle external nodes if the cell is a module.
     *
     * @return {boolean} - `true` if a module, or `false`
     */
    canHoldExternalNodes: function() {
        return this.isModule();
    },

    /**
     * Return a node to be attached by {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}:
     *
     * - a {@link module:Grid.Components.ModuleHolder module holder} if we are in design mode
     * - a module, directly, if we are NOT in design mode
     *
     * The nodes are returned by the {@link module:Grid.Components.ModulesCache ModulesCache} module.
     *
     * @param  {string} className - The class name of the dom node to return
     * @return {DomNode} - Either the module dom node, or the holder one, or nothing if it's not a module
     */
    getExternalNode: function(className) {
        // don't return anything if it's not a module (this shouldn't be necessary because
        // the check is done in `canHoldExternalNodes` which is called before, but...)
        if (!this.isModule()) { return; }

        // will attach module only if not in design mode
        if (className == ModulesCache.moduleContainerClassName && !this.isInDesignMode()) {
            return ModulesCache.getModuleComponent(this);
        }

        // will attach module holder only if in design mode
        if (className == ModulesCache.holderContainerClassName && this.isInDesignMode()) {
            return ModulesCache.getHolderComponent(this);
        }
    },

    /**
     * Tell if the cell is a placeholder cell
     *
     * @return {Boolean} - `true` if a placeholder cell
     */
    isPlaceholder: function() {
        return this.getType() == 'placeholder';
    },

    /**
     * Tell if the cell is a "grid" cell (subgrid)
     *
     * @return {Boolean} - `true` if a "grid" cell (subgrid)
     */
    isSubGrid: function() {
        return this.getType() == 'grid';
    },

    /**
     * Tell if the cell is a "module" cell
     *
     * @return {Boolean} - `true` if a "module" cell
     */
    isModule: function() {
        return this.getType() == 'module';
    },

    /**
     * Render the cell as a SubGrid component
     *
     * @return {module:Grid.Components.SubGrid} - The rendered {@link module:Grid.Components.SubGrid SubGrid} component
     */
    renderAsSubGrid: function() {
        var SubGrid = require('./SubGrid.jsx');
        return <SubGrid node={this.state.node} />
    },

    /**
     * Return the classes to use when rendering the current module cell
     *
     * @return {React.addons.classSet}
     *
     * One or more of these classes:
     *
     * - `grid-cell`: in all cases
     * - `grid-cell-module`: always `true` (this method is called only if it's a module)
     * - `grid-cell-module-dragging`: if this module cell is the currently dragged one
     * - `grid-cell-module-focused`: if this module cell is the currently focused one
     *
     */
    getModuleCellClasses: function() {
        var gridName = this.getGridName();
        var classes = {
            'grid-cell': true,
            'grid-cell-module': true,
            'grid-cell-module-dragging': Store.isDraggingCell(gridName, this.state.node),
            'grid-cell-module-focused': Store.isFocusedModuleCell(gridName, this.state.node),
        };
        return cx(classes);
    },

    /**
     * Return the inline styles to use when rendering the current module cell
     *
     * @return {Object} - An object including styles
     *
     * One or more of these styles:
     *
     * - `flexGrow`: the relative size of the cell as defined in the grid
     */
    getModuleStyle: function() {
        var style = {
            flexGrow: Store.getRelativeSize(this.state.node),
        };
        return style;
    },

    /**
     * Tell if the current cell has the focus (itself or one of its child node)
     *
     * @return {Boolean} - `true` if the cell has the focus, or `false`
     */
    hasFocus: function() {
        var domNode = this.getDOMNode();
        if (!domNode) { return false; }
        var activeElement = document.activeElement;
        // the cell itself
        if (activeElement == domNode) { return true; }
        // one of its child node
        if (domNode.contains(activeElement)) { return true; }
        return false;
    },

    /**
     * Called in response to the `focus` dom event, ie the the user click/tab
     * on the cell, to ask the store to focus the current cell.
     */
    onFocusModuleCell: function() {
        if (!Store.isFocusedModuleCell(this.getGridName(), this.state.node)) {
            Actions.focusModuleCell(this.getGridName(), this.state.node);
        }
    },

    /**
     * Called in response to the `focus.on` event, ie when the user focus this
     * module cell, to set the focus if not already done, and mark the cell as focused.
     *
     * The class is added via direct dom manipulation to avoid rerender the cell,
     * but the class is also correctly managed by the `getModuleCellClasses` method.
     *
     * @param  {string} gridName - The grid name for which the `focus.on` event is triggered
     * @param  {[type]} focusedModuleCellId - The id of the module cell that is the new focused one
     */
    onNavigateTo: function(gridName, focusedModuleCellId) {
        if (!this.isModule() || gridName != this.getGridName() || this.state.node.getAttribute('id') != focusedModuleCellId) {
            return;
        }

        var domNode = this.getDOMNode();
        if (!domNode) { return; }

        domNode.classList.add('grid-cell-module-focused');
        if (!this.hasFocus()) {
            domNode.focus();
        };
    },

    /**
     * Called in response to the `focus.off` event, ie when the user stop focusing this
     * module cell, to mark the cell as not focused.
     *
     * The class is removed via direct dom manipulation to avoid rerender the cell,
     * but the class is also correctly managed by the `getModuleCellClasses` method.
     *
     * @param  {string} gridName - The grid name for which the `focus.off` event is triggered
     * @param  {[type]} oldFocusedModuleCellId - The id of the module cell that was the focused one
     */
    onNavigateFrom: function(gridName, oldFocusedModuleCellId) {
        if (!this.isModule() || gridName != this.getGridName() || this.state.node.getAttribute('id') != oldFocusedModuleCellId) {
            return;
        }

        var domNode = this.getDOMNode();
        if (!domNode) { return; }

        domNode.classList.remove('grid-cell-module-focused');
    },

    /**
     * Called when the cell is mounted on the dom, to respond to focus on/off events
     * from the store
     */
    componentDidMount: function() {
        if (this.isModule()) {
            Store.on('grid.navigate.focus.on', this.onNavigateTo);
            Store.on('grid.navigate.focus.off', this.onNavigateFrom);
        }
    },

    /**
     * Called when the cell will be unmounted from the dom, to stop responding to
     * focus on/off events from the store
     */
    componentWillUnmount: function() {
        if (this.isModule()) {
            Store.off('grid.navigate.focus.on', this.onNavigateTo);
            Store.off('grid.navigate.focus.off', this.onNavigateFrom);
        }
    },

    /**
     * Render the cell as a standalone component: a empty div that will hold
     * the real module component (not directly rendered),
     * via {@link module:Grid.Components.Mixins.NodesHolder NodesHolderMixin}
     *
     * The `tabindex` attribute of the dom node is set to `0` to make the cell
     * focusable.
     */
    renderAsModule: function() {
        return <div className={this.getModuleCellClasses()}
                    style={this.getModuleStyle()}
                    tabIndex="0"
                    onFocus={this.onFocusModuleCell} />
    },

    /**
     * Render the cell as a {@link module:Grid.Components.Placeholder Placeholder component}
     */
    renderAsPlaceholder: function() {
        return <Placeholder node={this.state.node} />;
    },

    /**
     * Render the cell depending on its type
     */
    render: function() {
        switch(this.getType()) {
            case 'grid':
                return this.renderAsSubGrid();
                break;
            case 'placeholder':
                return this.renderAsPlaceholder();
                break;
            case 'module':
                return this.renderAsModule();
                break;
        }
    }

};

module.exports = Cell = React.createClass(Cell);
