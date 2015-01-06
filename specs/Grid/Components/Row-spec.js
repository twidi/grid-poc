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

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        gridRow = testGrid.querySelector('rows');

        setTimeout(done, 0.01);
    });

    afterEach(function() {
        componentUtils.unmountAllComponents();
    });

    it("should access its main grid", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(gridRow.getAttribute('id'));
    });

    it("should get the main grid name", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it("should get the design mode step", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it("should know if it's in design mode", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it("should be able to get its grid cells", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        var cells =component.getCells();
        var expectedCells = _.toArray(gridRow.querySelectorAll(':scope > cells'));
        expect(cells).toEqual(expectedCells);
    });

    it("should know if it's a placeolder or not", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        gridRow = testGrid.querySelector('rows[type=placeholder]');
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isPlaceholder()).toBe(true);

        gridRow = testGrid.querySelector('rows:not([type=placeholder])');
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isPlaceholder()).toBe(false);
    });

    it("should render a row", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-row')).toBe(true);
        expect(domNode.classList.contains('grid-row-placeholder')).toBe(false);
    });

    it("should render a placeholder", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);
        var placeholderGridRow = testGrid.querySelector('rows[type=placeholder]');
        var element = React.createElement(Row, {node: placeholderGridRow});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-row')).toBe(true);
        expect(domNode.classList.contains('grid-row-placeholder')).toBe(true);
    });

    it("should be able to render its cells", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        var cells = component.renderCells();
        expect(cells.length).toEqual(2);
        _(cells).forEach(function(cell) {
            expect(TestUtils.isElementOfType(cell, Cell)).toBe(true);
        });
    });

    it("should render sub components", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(3);  // including self
        expect(componentUtils.countModules(component)).toEqual(3);
        expect(componentUtils.countSubGrids(component)).toEqual(1);
    });

});