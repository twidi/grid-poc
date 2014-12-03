var _ = require('lodash');

var Manipulator = require('./../../app/Grid/Manipulator.js');

var customMatchers = require('./custom-matchers.js');


describe("Grid.Manipulator", function() {

    beforeEach(function() {
        jasmine.addMatchers(customMatchers);
    });


    it("should convert Json to Xml and vice-versa", function() {
        var j = {
            _param1: 1,
            _param2: 2,
            child: {
                _childParam: 3,
                subChild: {
                    _subChildParam: 4
                }
            },
            childs: [
                {
                    _childs1Param: 5
                },
                {
                    _childs2Param: 6
                },
                {
                    _childs3Param: 7,
                    subChild: {
                        _subChildParam: 8
                    }
                }
            ]
        };

        var s = Manipulator.JSONGridToXMLString(j);
        expect(s).toEqual(
            '<grid param1="1" param2="2">' +
                '<child childParam="3">' +
                    '<subChild subChildParam="4"/>' +
                '</child>' +
                '<childs childs1Param="5"/>' +
                '<childs childs2Param="6"/>' +
                '<childs childs3Param="7">' +
                    '<subChild subChildParam="8"/>' +
                '</childs>' +
            '</grid>'
        );

        var root = Manipulator.JSONGridToXML(j);
        var j2 = Manipulator.XMLGridToJSON(root);
        expect(j2).toEqual(j);

    });

    it("should clone a grid", function() {
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="grid">' +
                            '<content>' +
                                '<rows>' +
                                    '<cells type="module"><content/></cells>' +
                                '</rows>' +
                            '</content>' +
                        '</cells>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');

        var clone = Manipulator.clone(grid);
        expect(Manipulator.XMLGridToXMLString(clone)).toEqual(Manipulator.XMLGridToXMLString(grid));
    });

    it("should create a new grid", function() {
        var grid = Manipulator.createBaseGrid('foo', 5);

        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content/>' +
            '</grid>';
        expect(grid).toEqualXML(expected);
    });

    it("should add a row", function() {
        var grid = Manipulator.createBaseGrid('foo', 5);

        // with an empty rows list
        Manipulator.addRow(grid); // the grid is the first child of the "root document"
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows/>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // with a rows list with one row
        var row = Manipulator.addRow(grid);
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows/>' +
                    '<rows/>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // check that we really have the real row
        row.setAttribute('foo', 'bar');
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows/>' +
                    '<rows foo="bar"/>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // transform a non-grid node (we have to create a cell for that)
        grid = Manipulator.createBaseGrid('foo', 5);
        row = Manipulator.addRow(grid);
        var cell = Manipulator.addCell(row, 'module');
        cell.setAttribute('foo', 'bar');
        cell.querySelector(':scope > content').setAttribute('bar', 'baz');
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module" foo="bar"><content bar="baz"/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        Manipulator.addRow(cell);
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="grid" foo="bar">' +
                            '<content>' +
                                '<rows>' +
                                    '<cells type="module"><content bar="baz"/></cells>' +
                                '</rows>' +
                                '<rows/>' +
                            '</content>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

    });

    it("should add a row before another one", function() {
        var grid = Manipulator.createBaseGrid('foo', 5);
        var row1 = Manipulator.addRow(grid);
        row1.setAttribute('created', 'first');

        // add a row before the first one
        var row2 = Manipulator.addRow(grid, row1);
        row2.setAttribute('inserted', 'before');

        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows inserted="before"/>' +
                    '<rows created="first"/>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // add a module cell and add a row asking to set it before another
        var cell = Manipulator.addCell(row1, 'module');

        // this should fail
        expect(function() {
            Manipulator.addRow(cell, row1)
        }).toThrowError(Manipulator.Exceptions.Inconsistency, "Cannot insert before a row if there is no row");

        // transform this cell to have rows and try to use one from the first level for the beforeRow argument
        var subRow1 = Manipulator.addRow(cell);
        subRow1.setAttribute('created', 'first (sub-row)');

        // this should fail
        expect(function() {
            Manipulator.addRow(cell, row1)
        }).toThrowError(Manipulator.Exceptions.Inconsistency, "The 'beforeRow' must be a child of the content of the 'node'");

        // now a working test but at a sublevel, to be sure
        var subRow2 = Manipulator.addRow(cell, subRow1);
        subRow2.setAttribute('inserted', 'before (sub-row)');

        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows inserted="before"/>' +
                    '<rows created="first">' +
                        '<cells type="grid">' +
                            '<content>' +
                                '<rows><cells type="module"><content/></cells></rows>' +
                                '<rows inserted="before (sub-row)"/>' +
                                '<rows created="first (sub-row)"/>' +
                            '</content>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

    });

    it("should add a cell", function() {
        var grid = Manipulator.createBaseGrid('foo', 5);
        var row = Manipulator.addRow(grid);

        // with an empty cells list
        Manipulator.addCell(row, 'grid');
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="grid">' +
                            '<content/>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // with a cells list with one cell
        var cell = Manipulator.addCell(row, 'grid');
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="grid">' +
                            '<content/>' +
                        '</cells>' +
                        '<cells type="grid">' +
                            '<content/>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // check that we really have the real cell
        cell.setAttribute('foo', 'bar');
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="grid">' +
                            '<content/>' +
                        '</cells>' +
                        '<cells type="grid" foo="bar">' +
                            '<content/>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // shouldn't be able to add cell with an invalid type
        expect(function() {
            Manipulator.addCell(row, 'foo')
        }).toThrowError(Manipulator.Exceptions.InvalidType, "Cannot add cell of type <foo>. Should be <grid> or <module>");

    });

    it("should add a cell before another one", function() {
        var grid = Manipulator.createBaseGrid('foo', 5);
        var row = Manipulator.addRow(grid);
        var cell1 = Manipulator.addCell(row, 'module');
        cell1.setAttribute('created', 'first');

        // add a cell before the first one
        var cell2 = Manipulator.addCell(row, 'module', cell1);
        cell2.setAttribute('inserted', 'before');

        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module" inserted="before"><content/></cells>' +
                        '<cells type="module" created="first"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

        // add a new sub level of cells to try to insert cell before one at another level
        var subRow = Manipulator.addRow(cell1);
        var subCell1 = Manipulator.addCell(subRow, 'module');
        subCell1.setAttribute('created', 'first (sub-cell)');

        // this should fail
        expect(function() {
            Manipulator.addCell(subRow, 'module', cell2);
        }).toThrowError(Manipulator.Exceptions.Inconsistency, "The 'beforeCell' must be a child of 'row'");

        // now a working test but at a sublevel, to be sure
        var subCell2 = Manipulator.addCell(subRow, 'module', subCell1);
        subCell2.setAttribute('inserted', 'before (sub-cell)');

        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module" inserted="before"><content/></cells>' +
                        '<cells type="grid" created="first">' +
                            '<content>' +
                                '<rows>' +
                                    '<cells type="module"><content/></cells>' +
                                '</rows>' +
                                '<rows>' +
                                    '<cells type="module" inserted="before (sub-cell)"><content/></cells>' +
                                    '<cells type="module" created="first (sub-cell)"><content/></cells>' +
                                '</rows>' +
                            '</content>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';
        expect(grid).toEqualXML(expected);

    });

    it("should create a full grid", function() {
        var grid = Manipulator.createBaseGrid('foo', 5);
        var row1 = Manipulator.addRow(grid);
            var cell1 = Manipulator.addCell(row1, 'grid');
                var row = Manipulator.addRow(cell1);
                    var cell2 = Manipulator.addCell(row, 'module');
                    cell2.querySelector(':scope > content').setAttribute('path', 'path.to.module1');
                    var cell3 = Manipulator.addCell(row, 'module');
                    cell3.querySelector(':scope > content').setAttribute('path', 'path.to.module2');
                var row3 = Manipulator.addRow(cell1);
                    var cell4 = Manipulator.addCell(row3, 'module');
                    cell4.querySelector(':scope > content').setAttribute('path', 'path.to.module3');
                    var cell5 = Manipulator.addCell(row3, 'grid');
                        var row4 = Manipulator.addRow(cell5);
                            var cell6 = Manipulator.addCell(row4, 'module')
                            cell6.querySelector(':scope > content').setAttribute('path', 'path.to.module4');
            var cell7 = Manipulator.addCell(row1, 'grid');

            var expected =
                '<grid name="foo" space="5px" type="mainGrid">' +
                    '<content>' +
                        '<rows>' +
                            '<cells type="grid">' +
                                '<content>' +
                                    '<rows>' +
                                        '<cells type="module"><content path="path.to.module1"/></cells>' +
                                        '<cells type="module"><content path="path.to.module2"/></cells>' +
                                    '</rows>' +
                                    '<rows>' +
                                        '<cells type="module"><content path="path.to.module3"/></cells>' +
                                        '<cells type="grid">' +
                                            '<content>' +
                                                '<rows>' +
                                                    '<cells type="module"><content path="path.to.module4"/></cells>' +
                                                '</rows>' +
                                            '</content>' +
                                        '</cells>' +
                                    '</rows>' +
                                '</content>' +
                            '</cells>' +
                            '<cells type="grid"><content/></cells>' +
                        '</rows>' +
                    '</content>' +
                '</grid>';

        expect(grid).toEqualXML(expected);
    });

    it("should clean a grid", function() {

        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows id="r1">' +
                        '<cells type="grid" id="c1" toclean="2">' +
                            '<content>' +
                                '<rows id="r2">' +
                                    '<cells type="grid" id="c2">' +
                                        '<content>' +
                                            '<rows id="r3">' +
                                                '<cells type="grid" toclean="1" id="c3">' +
                                                    '<content>' +
                                                        '<rows id="r4">' +
                                                            '<cells type="module" id="c4">' +
                                                                '<content foo="bar"/>' +
                                                            '</cells>' +
                                                            '<cells type="grid"/>' +
                                                            '<cells type="grid">' +
                                                                '<content>' +
                                                                    '<rows/>' +
                                                                    '<rows>' +
                                                                        '<cells type="grid">' +
                                                                            '<content/>' +
                                                                        '</cells>' +
                                                                    '</rows>' +
                                                                '</content>' +
                                                            '</cells>' +
                                                        '</rows>' +
                                                    '</content>' +
                                                '</cells>' +
                                            '</rows>' +
                                        '</content>' +
                                    '</cells>' +
                                '</rows>' +
                                '<rows id="r5"><cells type="module" id="c6"><content/></cells></rows>' +
                            '</content>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');

        // then clean
        Manipulator.cleanGrid(grid.querySelector('cells[toclean="1"]'));

        // we should have the useless rows and grids removed
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows id="r2">' +
                        '<cells type="module" id="c2">' +
                            '<content foo="bar"/>' +
                        '</cells>' +
                    '</rows>' +
                    '<rows id="r5"><cells type="module" id="c6"><content/></cells></rows>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

    });

    it("should manage placeholders", function() {
        // do it on an empty grid
        var grid = Manipulator.createBaseGrid('foo');
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content/>' +
            '</grid>';

        Manipulator.addPlaceholders(grid);

        // cannot add placeholders again
        expect(function() {
            Manipulator.addPlaceholders(grid);
        }).toThrowError(Manipulator.Exceptions.InvalidState);

        var expectedWithPlaceholders =
            '<grid name="foo" space="5px" type="mainGrid" hasPlaceholders="true">' +
                '<content>' +
                    '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
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
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';

        var grid = Manipulator.XMLStringToXMLGrid(expected);

        Manipulator.addPlaceholders(grid);

        var expectedWithPlaceholders =
            '<grid name="foo" space="5px" type="mainGrid" hasPlaceholders="true">' +
                '<content>' +
                    '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
                    '<rows>' +
                        '<cells type="placeholder"><content/></cells>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="placeholder"><content/></cells>' +
                    '</rows>' +
                    '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expectedWithPlaceholders);

        Manipulator.removePlaceholders(grid);
        expect(grid).toEqualXML(expected);

        // do it with with a grid with many rows/many cells
        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                    '<rows>' +
                        '<cells type="grid">' +
                            '<content>' +
                                '<rows>' +
                                    '<cells type="module"><content/></cells>' +
                                    '<cells type="module"><content/></cells>' +
                                '</rows>' +
                                '<rows>' +
                                    '<cells type="module"><content/></cells>' +
                                '</rows>' +
                            '</content>' +
                        '</cells>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';

        var grid = Manipulator.XMLStringToXMLGrid(expected);

        Manipulator.addPlaceholders(grid);

        var expectedWithPlaceholders =
            '<grid name="foo" space="5px" type="mainGrid" hasPlaceholders="true">' +
                '<content>' +
                    '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
                    '<rows>' +
                        '<cells type="placeholder"><content/></cells>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="placeholder"><content/></cells>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="placeholder"><content/></cells>' +
                    '</rows>' +
                    '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
                    '<rows>' +
                        '<cells type="placeholder"><content/></cells>' +
                        '<cells type="grid">' +
                            '<content>' +
                                '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
                                '<rows>' +
                                    '<cells type="placeholder"><content/></cells>' +
                                    '<cells type="module"><content/></cells>' +
                                    '<cells type="placeholder"><content/></cells>' +
                                    '<cells type="module"><content/></cells>' +
                                    '<cells type="placeholder"><content/></cells>' +
                                '</rows>' +
                                '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
                                '<rows>' +
                                    '<cells type="placeholder"><content/></cells>' +
                                    '<cells type="module"><content/></cells>' +
                                    '<cells type="placeholder"><content/></cells>' +
                                '</rows>' +
                                '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
                            '</content>' +
                        '</cells>' +
                        '<cells type="placeholder"><content/></cells>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="placeholder"><content/></cells>' +
                    '</rows>' +
                    '<rows type="placeholder"><cells type="placeholder"><content/></cells></rows>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expectedWithPlaceholders);

        Manipulator.removePlaceholders(grid);
        expect(grid).toEqualXML(expected);

    });

    it("should not clean placeholder with a module", function() {
        var grid = Manipulator.createBaseGrid('foo');
        var row = Manipulator.addRow(grid);
        Manipulator.addCell(row, "module");

        Manipulator.addPlaceholders(grid);

        // add a module in a placeholder cell (in the second row (our first original one), last cell (a placeholder))
        var cell = grid.querySelector('rows:nth-child(2) > cells:last-child');
        cell.setAttribute('type', 'module');
        cell.setAttribute('was', 'placeholder');

        Manipulator.removePlaceholders(grid);

        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="module" was="placeholder"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

        // do it again but set the module in a cell placeholder within a row placeholder

        Manipulator.addPlaceholders(grid);
        var cell = grid.querySelector('rows:last-child > cells');
        cell.setAttribute('type', 'module');
        cell.setAttribute('was', 'placeholder, too');

        Manipulator.removePlaceholders(grid);

        var expected =
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="module" was="placeholder"><content/></cells>' +
                    '</rows>' +
                    '<rows>' +
                        '<cells type="module" was="placeholder, too"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

    });

    it("should return the neareset grid", function() {
        var grid = Manipulator.createBaseGrid('foo', 5);
        var row = Manipulator.addRow(grid);
        var gridCell = Manipulator.addCell(row, "grid");
        var gridContent = gridCell.querySelector(':scope > content');
        var subRow = Manipulator.addRow(gridCell);
        var contentCell = Manipulator.addCell(subRow, "module");
        var content = contentCell.querySelector(':scope > content');

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

    it("should move a content to a placeholder", function() {
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module">' +
                            '<content id="mod1"/>' +
                        '</cells>' +
                        '<cells type="module">' +
                            '<content id="mod2"/>' +
                        '</cells>' +
                    '</rows>' +
                    '<rows>' +
                        '<cells type="module">' +
                            '<content id="mod3"/>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');

        var content = grid.querySelector('content[id=mod1]');
        Manipulator.addPlaceholders(grid);
        var destination = grid.querySelector('content[id=mod3]').parentNode.nextSibling;
        Manipulator.moveContentToPlaceholder(content, destination);
        Manipulator.removePlaceholders(grid);

        var expected = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module">' +
                            '<content id="mod2"/>' +
                        '</cells>' +
                    '</rows>' +
                    '<rows>' +
                        '<cells type="module">' +
                            '<content id="mod3"/>' +
                        '</cells>' +
                        '<cells type="module">' +
                            '<content id="mod1"/>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');
        expect(grid).toEqualXML(expected);

        // cannot move to a non placeholder cell
        expect(function() {
            Manipulator.moveContentToPlaceholder(content, grid.querySelector('content[id=mod2]').parentNode);
        }).toThrowError(Manipulator.Exceptions.InvalidType, "Cannot move content in cell of type <module>. It must be <placeholder>");

        // test with a detached module
        var parentGrid = Manipulator.getNearestGrid(content);
        content.parentNode.removeChild(content);
        Manipulator.cleanGrid(parentGrid);
        Manipulator.addPlaceholders(grid);
        var destination = grid.querySelector('content[id=mod3]').parentNode.nextSibling;
        Manipulator.moveContentToPlaceholder(content, destination);
        Manipulator.removePlaceholders(grid);
        expect(grid).toEqualXML(expected);
    });

    it("should create a module node with simple keys/values pairs", function() {
        var j = {
            _foo: 1,
            _bar: "B.A.R",
        }
        var node = Manipulator.createModuleNode(j);

        var expected = '<content foo="1" bar="B.A.R"/>';

        expect(node).toEqualXML(expected);
    });

    it("should allow the full workflow of a drag'n'drop", function() {
        // first we create a simple grid
        var grid = Manipulator.createBaseGrid('foo', 5);
        // get a module from somewhere to insert
        var content1 = Manipulator.createModuleNode({_path: 'test.module.1'});
        // go in "design" mode
        Manipulator.addPlaceholders(grid);
        // add the module in the only placeholder cell
        Manipulator.moveContentToPlaceholder(content1, grid.querySelector('cells[type=placeholder]'));
        // reset the placeholders with the new grid
        Manipulator.cleanPlaceholders(grid);
        // get another module from somewhere to insert
        var content2 = Manipulator.createModuleNode({_path: 'test.module.2'});
        // add it to the last placeholder row
        Manipulator.moveContentToPlaceholder(content2, grid.querySelector(':scope > content > rows[type=placeholder] > cells[type=placeholder]'));
        // reset the placeholders with the new grid
        Manipulator.cleanPlaceholders(grid);
        // now move the first content on the right of the second one
        Manipulator.moveContentToPlaceholder(content1, content2.parentNode.nextSibling);
        // finally exit the design mode
        Manipulator.removePlaceholders(grid);

        // we should have both contents in the only row
        var expected = 
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module">' +
                            '<content path="test.module.2"/>' +
                        '</cells>' +
                        '<cells type="module">' +
                            '<content path="test.module.1"/>' +
                        '</cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);
    });

    it("should set an ID on each node", function() {
        // we mock the uniqueId function of lodash to know the value to expect
        spyOn(_, "uniqueId").and.callFake(function(prefix) {
            return prefix + 123;
        });

        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="grid">' +
                            '<content>' +
                                '<rows>' +
                                    '<cells type="module"><content/></cells>' +
                                '</rows>' +
                            '</content>' +
                        '</cells>' +
                    '</rows>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');

        Manipulator.setIds(grid);

        var expected =
            '<grid name="foo" space="5px" type="mainGrid" id="grid-123">' +
                '<content id="content-123">' +
                    '<rows id="rows-123">' +
                        '<cells type="module" id="cells-123"><content id="content-123"/></cells>' +
                        '<cells type="grid" id="cells-123">' +
                            '<content id="content-123">' +
                                '<rows id="rows-123">' +
                                    '<cells type="module" id="cells-123"><content id="content-123"/></cells>' +
                                '</rows>' +
                            '</content>' +
                        '</cells>' +
                    '</rows>' +
                    '<rows id="rows-123">' +
                        '<cells type="module" id="cells-123"><content id="content-123"/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>';

        expect(grid).toEqualXML(expected);

    });

});