var _ = require('lodash');
var React = require('react/addons');  // react + addons
var TestUtils = React.addons.TestUtils;

var Cell = require('../../../app/Grid/Components/Cell.jsx');
var Manipulator = require('../../../app/Grid/Manipulator.js');
var Store = require('../../../app/Grid/Store.js');
var SubGrid = require('../../../app/Grid/Components/SubGrid.jsx');

var Utils = require('../../Utils.js');
var componentUtils = require('./Utils.js');


describe("Grid.Components.Cell", function() {
    var uniqueIdMock;

    // main grid and some cells, defined in beforeEach
    var testGrid;
    var moduleGridCell;
    var subGridCell;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        moduleGridCell = testGrid.querySelector('cells[type=module]');
        subGridCell = testGrid.querySelector('cells[type=grid]');

        setTimeout(done, 0.01);
    });

    it("should access its main grid", function() {
        var component = TestUtils.renderIntoDocument(Cell({node: subGridCell}));
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var component = TestUtils.renderIntoDocument(Cell({node: subGridCell}));
        expect(component.getNodeId()).toBe(subGridCell.getAttribute('id'));
    });

    it("should get the type of a grid cell", function() {
        var component = TestUtils.renderIntoDocument(Cell({node: subGridCell}));
        expect(component.getType()).toEqual('grid');
    });

    it("should get the type of a module cell", function() {
        var moduleGridCell = testGrid.querySelector('cells[type=module]');
        var component = TestUtils.renderIntoDocument(Cell({node: moduleGridCell}));
        expect(component.getType()).toEqual('module');
    });

    it("should know if it's a placeolder or no", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        var gridCell = testGrid.querySelector('cells[type=placeholder]');
        var component = TestUtils.renderIntoDocument(Cell({node: gridCell}));
        expect(component.isPlaceholder()).toBe(true);

        var gridCell = testGrid.querySelector('cells:not([type=placeholder])');
        var component = TestUtils.renderIntoDocument(Cell({node: gridCell}));
        expect(component.isPlaceholder()).toBe(false);
    });

    it("should render a subgrid", function() {
        var component = TestUtils.renderIntoDocument(Cell({node: subGridCell}));
        var subGrid = component.renderAsSubGrid();
        expect(TestUtils.isElementOfType(subGrid, subGrid)).toBe(true);
        expect(subGrid.props.node).toBe(subGridCell);
    });

    it("should render a module", function() {
        var component = TestUtils.renderIntoDocument(Cell({node: moduleGridCell}));
        var result = component.renderAsModule();
        expect(TestUtils.isElementOfType(result, React.DOM.span)).toBe(true);
    });

});