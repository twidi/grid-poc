import React from 'react';

import { Store } from '../../Data';


/**
 * A base class to use for all grid components based on a XML grid node
 *
 * @memberOf module:Grid.Components.Bases
 *
 * @summary A base class to use for all grid components based on a XML grid node
 */
class GridNode extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            node: props.node
        };
    }

    /**
     * When the component props are updated, set the node in the state based
     * on the node from the new props, to be able to update it later
     *
     * @param  {object} nextProps - The new props to be received
     */
    componentWillReceiveProps(nextProps) {
        if (nextProps.node !== this.props.node) {
            this.setState({
                node: nextProps.node
            });
        }
    }


    /**
     * Get the type of the current XML Grid cell
     * @return {String} - Either "mainGrid", or "placeholder" or nothing for a row,
     * or "grid", "module" or "placeholder" for a cell
     */
    getType() {
        return this.state.node.getAttribute('type');
    }

    /**
     * Get the ID of the current node
     *
     * @return {String} - The ID of the node
     */
    getNodeId() {
        return Store.getNodeId(this.state.node);
    }

    /**
     * Get the main grid
     *
     * @return {Element|Node|XML} - The main grid the current node belongs to
     */
    getGrid() {
        return Store.getMainGrid(this.state.node);
    }

    /**
     * Get the main grid name
     *
     * @return {Element|Node|XML} - The name of the main grid the current node belongs to
     */
    getGridName() {
        return Store.getMainGridName(this.state.node);
    }

    /**
     * Get the current design mode step for the main Grid
     *
     * @return {String} - The name of the design mode step
     *
     * @todo: find a way to cache this to avoid calling the getAttribute method every time
     */
    getDesignModeStep() {
        return Store.getDesignModeStep(this.getGridName());
    }

    /**
     * Get the design mode status of this component
     *
     * @return {boolean} - True if the grid is in design mode, else False
     */
    isInDesignMode() {
        return (this.getDesignModeStep() !== 'disabled');
    }

}

GridNode.displayName = 'GridNode';

export { GridNode };
