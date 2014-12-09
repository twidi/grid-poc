var _ = require('lodash');
var React = require('react/addons');  // react + addons
var TestUtils = React.addons.TestUtils;


var Cell = require('../../../app/Grid/Components/Cell.jsx');
var Manipulator = require('../../../app/Grid/Manipulator.js');
var Row = require('../../../app/Grid/Components/Row.jsx');
var Store = require('../../../app/Grid/Store.js');

var Utils = require('../../Utils.js');
var componentUtils = require('./Utils.js');


describe("Grid.Components.Row", function() {
    var uniqueIdMock;

    // main grid, and the row to test defined in beforeEach
    var testGrid;
    var gridRow;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        gridRow = testGrid.querySelector('rows');

        setTimeout(done, 0.01);
    });

    it("should access its main grid", function() {
        var component = TestUtils.renderIntoDocument(Row({node: gridRow}));
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var component = TestUtils.renderIntoDocument(Row({node: gridRow}));
        expect(component.getNodeId()).toBe(gridRow.getAttribute('id'));
    });

    it("should be able to get its grid cells", function() {
        var component = TestUtils.renderIntoDocument(Row({node: gridRow}));
        var cells =component.getCells();
        var expectedCells = _.toArray(gridRow.querySelectorAll(':scope > cells'));
        expect(cells).toEqual(expectedCells);
    });

    it("should know if it's a placeolder or not", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        gridRow = testGrid.querySelector('rows[type=placeholder]');
        var component = TestUtils.renderIntoDocument(Row({node: gridRow}));
        expect(component.isPlaceholder()).toBe(true);

        gridRow = testGrid.querySelector('rows:not([type=placeholder])');
        var component = TestUtils.renderIntoDocument(Row({node: gridRow}));
        expect(component.isPlaceholder()).toBe(false);
    });

    it("should be able to render its cells", function() {
        var component = TestUtils.renderIntoDocument(Row({node: gridRow}));
        var cells = component.renderCells();
        expect(cells.length).toEqual(2);
        _(cells).forEach(function(cell) {
            expect(TestUtils.isElementOfType(cell, Cell)).toBe(true);
        });
    });

    it("should render sub components", function() {
        var component = TestUtils.renderIntoDocument(Row({node: gridRow}));
        expect(componentUtils.countRows(component)).toEqual(3);  // including self
        expect(componentUtils.countModules(component)).toEqual(3);
        expect(componentUtils.countSubGrids(component)).toEqual(1);
    });

});