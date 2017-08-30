import { Grid } from './Bases';


/**
 * SubGrid component, a grid inside a cell, composed of rows
 *
 * @memberOf module:Grid.Components
 *
 * @summary The SubGrid component, inside a cell
 *
 * @extends module:Grid.Components.Bases.Grid
 */
class SubGrid extends Grid {

    /**
     * Render the component mainly by calling renderRows
     */
    render() {
        return this.renderGrid({}, {});
    }
}

SubGrid.displayName = 'SubGrid';

export { SubGrid };
