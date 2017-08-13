import _ from 'lodash';

import { Manipulator } from '../../app/Grid/Manipulator';

import { customMatchers } from './custom-matchers';
import { Utils } from '../Utils';


describe('Grid.Manipulator', function() {
    let uniqueIdMock;

    beforeEach(function() {
        jasmine.addMatchers(customMatchers);

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();
    });

    it('should clone a grid', function() {
        const grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        const clone = Manipulator.clone(grid);
        expect(Manipulator.XMLGridToXMLString(clone)).toEqual(Manipulator.XMLGridToXMLString(grid));
    });

    it('should create a new grid', function() {
        const grid = Manipulator.createBaseGrid('foo', 5);

        const expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content/>' +
            '</grid>';
        expect(grid).toEqualXML(expected);
    });

    it('should create a content node', function() {
        const grid = Manipulator.createBaseGrid('foo', 5);

        const contentNode = Manipulator.createContentNode(grid, {foo: 1, bar: 'baz'});
        expect(contentNode).toEqualXML('<content foo="1" bar="baz"/>');
    });

    it('should remove a cell', function() {
        const grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module"><content mode="foo"/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                        '<cell type="module"><content mode="bar"/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        const cell = grid.querySelector('cell[type=module]');
        Manipulator.removeCell(cell);

        // the cell should be removed, and the grid cleaned
        const expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content mode="bar"/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);
    });

    it('should add a row', function() {
        let grid = Manipulator.createBaseGrid('foo', 5);

        // with an empty rows list
        Manipulator.addRow(grid); // the grid is the first child of the "root document"
        let expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row/>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // with a rows list with one row
        let row = Manipulator.addRow(grid, null, 'foo');
        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row/>' +
                    '<row type="foo"/>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // check that we really have the real row
        row.setAttribute('foo', 'bar');
        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row/>' +
                    '<row type="foo" foo="bar"/>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // transform a non-grid node (we have to create a cell for that)
        grid = Manipulator.createBaseGrid('foo', 5);
        row = Manipulator.addRow(grid);
        const cell = Manipulator.addCell(row, null, 'module');
        cell.setAttribute('foo', 'bar');
        cell.querySelector(':scope > content').setAttribute('bar', 'baz');
        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module" foo="bar"><content bar="baz"/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        Manipulator.addRow(cell);
        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="grid" foo="bar">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module"><content bar="baz"/></cell>' +
                                '</row>' +
                                '<row/>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

    });

    it('should add a row before another one', function() {
        const grid = Manipulator.createBaseGrid('foo', 5);
        const row1 = Manipulator.addRow(grid);
        row1.setAttribute('created', 'first');

        // add a row before the first one
        const row2 = Manipulator.addRow(grid, row1);
        row2.setAttribute('inserted', 'before');

        let expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row inserted="before"/>' +
                    '<row created="first"/>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // add a module cell and add a row asking to set it before another
        const cell = Manipulator.addCell(row1, null, 'module');

        // this should fail
        expect(function() {
            Manipulator.addRow(cell, row1);
        }).toThrowError(Manipulator.Exceptions.Inconsistency, 'Cannot insert before a row if there is no row');

        // transform this cell to have rows and try to use one from the first level for the beforeRow argument
        const subRow1 = Manipulator.addRow(cell);
        subRow1.setAttribute('created', 'first (sub-row)');

        // this should fail
        expect(function() {
            Manipulator.addRow(cell, row1);
        }).toThrowError(Manipulator.Exceptions.Inconsistency, 'The \'beforeRow\' must be a child of the content of the \'node\'');

        // now a working test but at a sublevel, to be sure
        const subRow2 = Manipulator.addRow(cell, subRow1);
        subRow2.setAttribute('inserted', 'before (sub-row)');

        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row inserted="before"/>' +
                    '<row created="first">' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row><cell type="module"><content/></cell></row>' +
                                '<row inserted="before (sub-row)"/>' +
                                '<row created="first (sub-row)"/>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

    });

    it('should add a cell', function() {
        const grid = Manipulator.createBaseGrid('foo', 5);
        const row = Manipulator.addRow(grid);

        // with an empty cells list
        Manipulator.addCell(row, null, 'grid');
        let expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="grid">' +
                            '<content/>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // with a cells list with one cell
        const cell = Manipulator.addCell(row, null, 'grid');
        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="grid">' +
                            '<content/>' +
                        '</cell>' +
                        '<cell type="grid">' +
                            '<content/>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // check that we really have the real cell
        cell.setAttribute('foo', 'bar');
        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="grid">' +
                            '<content/>' +
                        '</cell>' +
                        '<cell type="grid" foo="bar">' +
                            '<content/>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // shouldn't be able to add cell with an invalid type
        expect(function() {
            Manipulator.addCell(row, null, 'foo');
        }).toThrowError(Manipulator.Exceptions.InvalidType, 'Cannot add cell of type <foo>. Should be <grid> or <module>');

    });

    it('should add a cell before another one', function() {
        const grid = Manipulator.createBaseGrid('foo', 5);
        const row = Manipulator.addRow(grid);
        const cell1 = Manipulator.addCell(row, null, 'module');
        cell1.setAttribute('created', 'first');

        // add a cell before the first one
        const cell2 = Manipulator.addCell(row, cell1, 'module');
        cell2.setAttribute('inserted', 'before');

        let expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module" inserted="before"><content/></cell>' +
                        '<cell type="module" created="first"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // add a new sub level of cells to try to insert cell before one at another level
        const subRow = Manipulator.addRow(cell1);
        const subCell1 = Manipulator.addCell(subRow, null, 'module');
        subCell1.setAttribute('created', 'first (sub-cell)');

        // this should fail
        expect(function() {
            Manipulator.addCell(subRow, cell2, 'module');
        }).toThrowError(Manipulator.Exceptions.Inconsistency, 'The \'beforeCell\' must be a child of \'row\'');

        // now a working test but at a sublevel, to be sure
        const subCell2 = Manipulator.addCell(subRow, subCell1, 'module');
        subCell2.setAttribute('inserted', 'before (sub-cell)');

        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module" inserted="before"><content/></cell>' +
                        '<cell type="grid" created="first">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module"><content/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module" inserted="before (sub-cell)"><content/></cell>' +
                                    '<cell type="module" created="first (sub-cell)"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

    });

    it('should create a full grid', function() {
        const grid = Manipulator.createBaseGrid('foo', 5);
        const row1 = Manipulator.addRow(grid);
            const cell1 = Manipulator.addCell(row1, null, 'grid');
                const row = Manipulator.addRow(cell1);
                    const cell2 = Manipulator.addCell(row, null, 'module');
                    cell2.querySelector(':scope > content').setAttribute('path', 'path.to.module1');
                    const cell3 = Manipulator.addCell(row, null, 'module');
                    cell3.querySelector(':scope > content').setAttribute('path', 'path.to.module2');
                const row3 = Manipulator.addRow(cell1);
                    const cell4 = Manipulator.addCell(row3, null, 'module');
                    cell4.querySelector(':scope > content').setAttribute('path', 'path.to.module3');
                    const cell5 = Manipulator.addCell(row3, null, 'grid');
                        const row4 = Manipulator.addRow(cell5);
                            const cell6 = Manipulator.addCell(row4, null, 'module');
                            cell6.querySelector(':scope > content').setAttribute('path', 'path.to.module4');
            const cell7 = Manipulator.addCell(row1, null, 'grid');

        const expected =
                '<grid name="foo" space="5px" type="mainGrid">' +
                    '<content>' +
                        '<row>' +
                            '<cell type="grid">' +
                                '<content>' +
                                    '<row>' +
                                        '<cell type="module"><content path="path.to.module1"/></cell>' +
                                        '<cell type="module"><content path="path.to.module2"/></cell>' +
                                    '</row>' +
                                    '<row>' +
                                        '<cell type="module"><content path="path.to.module3"/></cell>' +
                                        '<cell type="grid">' +
                                            '<content>' +
                                                '<row>' +
                                                    '<cell type="module"><content path="path.to.module4"/></cell>' +
                                                '</row>' +
                                            '</content>' +
                                        '</cell>' +
                                    '</row>' +
                                '</content>' +
                            '</cell>' +
                            '<cell type="grid"><content/></cell>' +
                        '</row>' +
                    '</content>' +
                '</grid>';

        expect(grid).toEqualXML(expected);
    });

    it('should clean a grid', function() {

        const grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row id="r1">' +
                        '<cell type="grid" id="c1" toclean="2">' +
                            '<content>' +
                                '<row id="r2">' +
                                    '<cell type="grid" id="c2">' +
                                        '<content>' +
                                            '<row id="r3">' +
                                                '<cell type="grid" toclean="1" surround="1" id="c3">' +
                                                    '<content>' +
                                                        '<row id="r4">' +
                                                            '<cell type="module" id="c4">' +
                                                                '<content foo="bar"/>' +
                                                            '</cell>' +
                                                            '<cell type="grid"/>' +
                                                            '<cell type="grid">' +
                                                                '<content>' +
                                                                    '<row/>' +
                                                                    '<row>' +
                                                                        '<cell type="grid">' +
                                                                            '<content/>' +
                                                                        '</cell>' +
                                                                    '</row>' +
                                                                '</content>' +
                                                            '</cell>' +
                                                        '</row>' +
                                                    '</content>' +
                                                '</cell>' +
                                            '</row>' +
                                        '</content>' +
                                    '</cell>' +
                                '</row>' +
                                '<row id="r5"><cell type="module" id="c6"><content/></cell></row>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        // then clean
        Manipulator.cleanGrid(grid.querySelector('cell[toclean="1"]'));

        // we should have the useless rows and grids removed
        const expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row id="r2">' +
                        '<cell type="module" id="c2">' +
                            '<content foo="bar"/>' +
                        '</cell>' +
                    '</row>' +
                    '<row id="r5"><cell type="module" id="c6"><content/></cell></row>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

    });

    it('should tell if it contains a subgrid', function() {
        const grid = Manipulator.createBaseGrid('foo');
        expect(Manipulator.containsSubGrid(grid)).toBe(false);

        let row = Manipulator.addRow(grid);
        Manipulator.addCell(row, null, 'module');
        expect(Manipulator.containsSubGrid(grid)).toBe(false);

        const subGrid = Manipulator.addCell(row, null, 'grid');
        expect(Manipulator.containsSubGrid(grid)).toBe(true);
        expect(Manipulator.containsSubGrid(subGrid)).toBe(false);

        row = Manipulator.addRow(subGrid);
        Manipulator.addCell(row, null, 'module');
        expect(Manipulator.containsSubGrid(grid)).toBe(true);
        expect(Manipulator.containsSubGrid(subGrid)).toBe(false);

        const subSubGrid = Manipulator.addCell(row, null, 'grid');
        expect(Manipulator.containsSubGrid(grid)).toBe(true);
        expect(Manipulator.containsSubGrid(subGrid)).toBe(true);
        expect(Manipulator.containsSubGrid(subSubGrid)).toBe(false);
    });

    it('should manage placeholders', function() {
        // do it on an empty grid
        let grid = Manipulator.createBaseGrid('foo');
        let expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content/>' +
            '</grid>';

        Manipulator.addPlaceholders(grid);

        // cannot add placeholders again
        expect(function() {
            Manipulator.addPlaceholders(grid);
        }).toThrowError(Manipulator.Exceptions.InvalidState);

        let expectedWithPlaceholders =
            '<grid name="foo" space="5px" type="mainGrid" hasPlaceholders="true">' +
                '<content>' +
                    '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expectedWithPlaceholders);

        Manipulator.removePlaceholders(grid);
        expect(grid).toEqualXML(expected);

        // cannot remove placeholders again
        expect(function() {
            Manipulator.removePlaceholders(grid);
        }).toThrowError(Manipulator.Exceptions.InvalidState);

        // do it wth a grid with one row/one cell
        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';

        grid = Manipulator.XMLStringToXMLGrid(expected);

        Manipulator.addPlaceholders(grid);

        expectedWithPlaceholders =
            '<grid name="foo" space="5px" type="mainGrid" hasPlaceholders="true">' +
                '<content>' +
                    '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                    '<row>' +
                        '<cell type="placeholder"><content/></cell>' +
                        '<cell type="module">' +
                            '<content/>' +
                        '</cell>' +
                        '<cell type="placeholder"><content/></cell>' +
                    '</row>' +
                    '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expectedWithPlaceholders);

        Manipulator.removePlaceholders(grid);
        expect(grid).toEqualXML(expected);

        // do it with with a grid with many rows/many cells
        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                    '<row>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module"><content/></cell>' +
                                    '<cell type="module"><content/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';

        grid = Manipulator.XMLStringToXMLGrid(expected);

        Manipulator.addPlaceholders(grid);

        const moduleCellReplacedByPlaceholders =
            '<cell type="grid" surround="1">' +
                '<content>' +
                    '<row type="placeholder"><cell type="placeholder" surround="1"><content/></cell></row>' +
                    '<row>' +
                        '<cell type="placeholder" surround="1"><content/></cell>' +
                        '<cell type="module"><content/></cell>' +
                        '<cell type="placeholder" surround="1"><content/></cell>' +
                    '</row>' +
                    '<row type="placeholder"><cell type="placeholder" surround="1"><content/></cell></row>' +
                '</content>' +
            '</cell>';

        expectedWithPlaceholders =
            '<grid name="foo" space="5px" type="mainGrid" surround="1" hasPlaceholders="true">' +
                '<content>' +
                    '<row type="placeholder"><cell type="placeholder" surround="1"><content/></cell></row>' +
                    '<row>' +
                        '<cell type="placeholder" surround="1"><content/></cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                                '<row>' +
                                    '<cell type="placeholder"><content/></cell>' +
                                    moduleCellReplacedByPlaceholders +
                                    '<cell type="placeholder"><content/></cell>' +
                                    moduleCellReplacedByPlaceholders +
                                    '<cell type="placeholder"><content/></cell>' +
                                '</row>' +
                                '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                                '<row>' +
                                    '<cell type="placeholder"><content/></cell>' +
                                    '<cell type="grid" surround="1">' +
                                        '<content>' +
                                            '<row type="placeholder"><cell type="placeholder" surround="1"><content/></cell></row>' +
                                            '<row>' +
                                                '<cell type="placeholder" surround="1"><content/></cell>' +
                                                '<cell type="grid">' +
                                                    '<content>' +
                                                        '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                                                        '<row>' +
                                                            '<cell type="placeholder"><content/></cell>' +
                                                            moduleCellReplacedByPlaceholders +
                                                            '<cell type="placeholder"><content/></cell>' +
                                                            moduleCellReplacedByPlaceholders +
                                                            '<cell type="placeholder"><content/></cell>' +
                                                        '</row>' +
                                                        '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                                                        '<row>' +
                                                            moduleCellReplacedByPlaceholders +
                                                        '</row>' +
                                                        '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                                                    '</content>' +
                                                '</cell>' +
                                                '<cell type="placeholder" surround="1"><content/></cell>' +
                                            '</row>' +
                                            '<row type="placeholder"><cell type="placeholder" surround="1"><content/></cell></row>' +
                                        '</content>' +
                                    '</cell>' +
                                    '<cell type="placeholder"><content/></cell>' +
                                    moduleCellReplacedByPlaceholders +
                                    '<cell type="placeholder"><content/></cell>' +
                                '</row>' +
                                '<row type="placeholder"><cell type="placeholder"><content/></cell></row>' +
                            '</content>' +
                        '</cell>' +
                        '<cell type="placeholder" surround="1"><content/></cell>' +
                    '</row>' +
                    '<row type="placeholder"><cell type="placeholder" surround="1"><content/></cell></row>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expectedWithPlaceholders);

        Manipulator.removePlaceholders(grid);
        expect(grid).toEqualXML(expected);
    });

    it('should not clean placeholder with a module', function() {
        const grid = Manipulator.createBaseGrid('foo');
        const row = Manipulator.addRow(grid);
        Manipulator.addCell(row, null, 'module');

        Manipulator.addPlaceholders(grid);

        // add a module in a placeholder cell (in the second row (our first original one), last cell (a placeholder))
        let cell = grid.querySelector(':scope > content > row:nth-child(2) > cell:last-child');
        cell.setAttribute('type', 'module');
        cell.setAttribute('was', 'placeholder');

        Manipulator.removePlaceholders(grid);

        let expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                        '<cell type="module" was="placeholder"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

        // do it again but set the module in a cell placeholder within a row placeholder

        Manipulator.addPlaceholders(grid);

        cell = grid.querySelector(':scope > content > row:last-child > cell');
        cell.setAttribute('type', 'module');
        cell.setAttribute('was', 'placeholder, too');

        Manipulator.removePlaceholders(grid);

        expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                        '<cell type="module" was="placeholder"><content/></cell>' +
                    '</row>' +
                    '<row>' +
                        '<cell type="module" was="placeholder, too"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

    });

    it('should return the neareset grid', function() {
        const grid = Manipulator.createBaseGrid('foo', 5);
        const row = Manipulator.addRow(grid);
        const gridCell = Manipulator.addCell(row, null, 'grid');
        const gridContent = gridCell.querySelector(':scope > content');
        const subRow = Manipulator.addRow(gridCell);
        const contentCell = Manipulator.addCell(subRow, null, 'module');
        const content = contentCell.querySelector(':scope > content');

        // test each node in our tree
        expect(Manipulator.getNearestGrid(content)).toBe(gridCell);
        expect(Manipulator.getNearestGrid(content, true)).toBe(gridCell);

        expect(Manipulator.getNearestGrid(contentCell)).toBe(gridCell);
        expect(Manipulator.getNearestGrid(contentCell, true)).toBe(gridCell);

        expect(Manipulator.getNearestGrid(subRow)).toBe(gridCell);
        expect(Manipulator.getNearestGrid(subRow, true)).toBe(gridCell);

        expect(Manipulator.getNearestGrid(gridContent)).toBe(gridCell);
        expect(Manipulator.getNearestGrid(gridContent, true)).toBe(gridCell);

        expect(Manipulator.getNearestGrid(gridCell)).toBe(grid);
        expect(Manipulator.getNearestGrid(gridCell, true)).toBe(gridCell);

        expect(Manipulator.getNearestGrid(row)).toBe(grid);
        expect(Manipulator.getNearestGrid(row, true)).toBe(grid);

        expect(Manipulator.getNearestGrid(grid)).toBe(null);
        expect(Manipulator.getNearestGrid(grid, true)).toBe(grid);

        // test a detached node
        subRow.removeChild(contentCell);
        expect(Manipulator.getNearestGrid(contentCell)).toBe(null);
    });

    it('should move a content to a placeholder', function() {
        const grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module">' +
                            '<content id="mod1"/>' +
                        '</cell>' +
                        '<cell type="module">' +
                            '<content id="mod2"/>' +
                        '</cell>' +
                    '</row>' +
                    '<row>' +
                        '<cell type="module">' +
                            '<content id="mod3"/>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        const content = grid.querySelector('content[id=mod1]');
        Manipulator.addPlaceholders(grid);
        let destination = grid.querySelector('content[id=mod3]').parentNode.nextSibling;
        Manipulator.moveContentToPlaceholder(content, destination);
        Manipulator.removePlaceholders(grid);

        const expected = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module">' +
                            '<content id="mod2"/>' +
                        '</cell>' +
                    '</row>' +
                    '<row>' +
                        '<cell type="module">' +
                            '<content id="mod3"/>' +
                        '</cell>' +
                        '<cell type="module">' +
                            '<content id="mod1"/>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');
        expect(grid).toEqualXML(expected);

        // cannot move to a non placeholder cell
        expect(function() {
            Manipulator.moveContentToPlaceholder(content, grid.querySelector('content[id=mod2]').parentNode);
        }).toThrowError(Manipulator.Exceptions.InvalidType, 'Cannot move content in cell of type <module>. It must be <placeholder>');

        // test with a detached module
        const parentGrid = Manipulator.getNearestGrid(content);
        content.parentNode.removeChild(content);
        Manipulator.cleanGrid(parentGrid);
        Manipulator.addPlaceholders(grid);
        destination = grid.querySelector('content[id=mod3]').parentNode.nextSibling;
        Manipulator.moveContentToPlaceholder(content, destination);
        Manipulator.removePlaceholders(grid);
        expect(grid).toEqualXML(expected);
    });

    it('should create a module node with simple keys/values pairs', function() {
        const j = {
            foo: 1,
            bar: 'B.A.R',
        };
        const node = Manipulator.createModuleNode(j);

        const expected = '<content foo="1" bar="B.A.R"/>';

        expect(node).toEqualXML(expected);
    });

    it('should allow the full workflow of a drag\'n\'drop', function() {
        // first we create a simple grid
        const grid = Manipulator.createBaseGrid('foo', 5);
        // get a module from somewhere to insert
        const content1 = Manipulator.createModuleNode({path: 'test.module.1'});
        // go in "design" mode
        Manipulator.addPlaceholders(grid);
        // add the module in the only placeholder cell
        Manipulator.moveContentToPlaceholder(content1, grid.querySelector('cell[type=placeholder]'));
        // reset the placeholders with the new grid
        Manipulator.cleanPlaceholders(grid);
        // get another module from somewhere to insert
        const content2 = Manipulator.createModuleNode({path: 'test.module.2'});
        // add it to the last placeholder row
        Manipulator.moveContentToPlaceholder(content2, grid.querySelector(':scope > content > row[type=placeholder] > cell[type=placeholder]'));
        // reset the placeholders with the new grid
        Manipulator.cleanPlaceholders(grid);
        // now move the first content on the right of the second one
        Manipulator.moveContentToPlaceholder(content1, content2.parentNode.nextSibling);
        // finally exit the design mode
        Manipulator.removePlaceholders(grid);

        // we should have both contents in the only row
        const expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module">' +
                            '<content path="test.module.2"/>' +
                        '</cell>' +
                        '<cell type="module">' +
                            '<content path="test.module.1"/>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);
    });

    it('should set id and indexes on each node', function() {

        let grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        Manipulator.setIds(grid);

        let expected =
            '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                '<content id="content-2">' +
                    '<row id="row-3">' +
                        '<cell type="module" id="cell-4" module-index="0"><content id="content-5"/></cell>' +
                        '<cell type="grid" id="cell-6">' +
                            '<content id="content-7">' +
                                '<row id="row-8">' +
                                    '<cell type="module" id="cell-9" module-index="1"><content id="content-10"/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                    '<row id="row-11">' +
                        '<cell type="module" id="cell-12" module-index="2"><content id="content-13"/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

        // check that existing ids are not changed
        grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content id="foobar"/>' +
            '</grid>');

        uniqueIdMock.reset();
        Manipulator.setIds(grid);

        expected =
            '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                '<content id="foobar"/>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

    });

    it('should add a resizer', function() {
        const grid = Manipulator.createBaseGrid('foo', 5);
        const row1 = Manipulator.addRow(grid);
        const row2 = Manipulator.addRow(grid);
        const row3 = Manipulator.addRow(grid);
        const cell1 = Manipulator.addCell(row1, null, 'module');
        const cell2 = Manipulator.addCell(row1, null, 'grid');
        const cell3 = Manipulator.addCell(row1, null, 'module');

        // fail before first row
        expect(function() {
            Manipulator.addResizer(row1);
        }).toThrowError(Manipulator.Exceptions.Inconsistency, 'Cannot add a resizer before the first node');

        // ok before the second one
        Manipulator.addResizer(row2);
        expect(row2.previousSibling.tagName).toEqual('resizer');
        expect(row2.parentNode.children.length).toEqual(4);

        // ok before the last one
        Manipulator.addResizer(row3);
        expect(row3.previousSibling.tagName).toEqual('resizer');
        expect(row3.parentNode.children.length).toEqual(5);

        // fail before first cell
        expect(function() {
            Manipulator.addResizer(cell1);
        }).toThrowError(Manipulator.Exceptions.Inconsistency, 'Cannot add a resizer before the first node');

        // ok before the second one
        Manipulator.addResizer(cell2);
        expect(cell2.previousSibling.tagName).toEqual('resizer');
        expect(cell2.parentNode.children.length).toEqual(4);

        // ok before the last one
        Manipulator.addResizer(cell3);
        expect(cell3.previousSibling.tagName).toEqual('resizer');
        expect(cell3.parentNode.children.length).toEqual(5);

    });

    it('should add and remove all resizers in a grid', function() {
        const grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row></row>' +
                                '<row>' +
                                    '<cell type="module"><content/></cell>' +
                                    '<cell type="module"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                    '<row></row>' +
                    '<row></row>' +
                '</content>' +
            '</grid>');

        Manipulator.addResizers(grid);

        let expected =
            '<grid name="foo" space="5px" type="mainGrid" hasResizers="true">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                        '<resizer type="vertical"/>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row/>' +
                                '<resizer type="horizontal"/>' +
                                '<row>' +
                                    '<cell type="module"><content/></cell>' +
                                    '<resizer type="vertical"/>' +
                                    '<cell type="module"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                        '<resizer type="vertical"/>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                    '<resizer type="horizontal"/>' +
                    '<row/>' +
                    '<resizer type="horizontal"/>' +
                    '<row/>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

        Manipulator.removeResizers(grid);

        expected = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row></row>' +
                                '<row>' +
                                    '<cell type="module"><content/></cell>' +
                                    '<cell type="module"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                    '<row></row>' +
                    '<row></row>' +
                '</content>' +
            '</grid>');

        expect(grid).toEqualXML(expected);
    });

    it('should get a cell next to an other', function() {

        const grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module" id="c1"><content/></cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module" id="c2"><content/></cell>' +
                                    '<cell type="module" id="c3"><content/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module" id="c4"><content/></cell>' +
                                    '<cell type="module" id="c5"><content/></cell>' +
                                    '<cell type="module" id="c6"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module" id="c7"><content/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module" id="c8"><content/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module" id="c9"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        const tests = [
            // base-cell, expected top, expected bottom, expected left, expected right
            ['#c1', undefined, undefined, undefined, '#c2'],
            ['#c2', undefined, '#c4', '#c1', '#c3'],
            ['#c3', undefined, '#c6', '#c2', '#c7'],
            ['#c4', '#c2', undefined, '#c1', '#c5'],
            ['#c5', '#c2', undefined, '#c4', '#c6'],
            ['#c6', '#c3', undefined, '#c5', '#c9'],
            ['#c7', undefined, '#c8', '#c3', undefined],
            ['#c8', '#c7', '#c9', '#c3', undefined],
            ['#c9', '#c8', undefined, '#c6', undefined],
        ];

        for (let numTest = 0; numTest < tests.length; numTest++) {
            const test = tests[numTest];
            const baseCell = grid.querySelector(test[0]);
            const cells = {
                Top: test[1] ? grid.querySelector(test[1]) : test[1],
                Bottom: test[2] ? grid.querySelector(test[2]) : test[2],
                Left: test[3] ? grid.querySelector(test[3]) : test[3],
                Right: test[4] ? grid.querySelector(test[4]) : test[4],
            };
            expect(Manipulator.getTopCell(baseCell)).toBe(cells.Top, 'top ' + test[0]);
            expect(Manipulator.getBottomCell(baseCell)).toBe(cells.Bottom, 'bottom ' + test[0]);
            expect(Manipulator.getLeftCell(baseCell)).toBe(cells.Left, 'left ' + test[0]);
            expect(Manipulator.getRightCell(baseCell)).toBe(cells.Right, 'right ' + test[0]);
        }

    });

});
