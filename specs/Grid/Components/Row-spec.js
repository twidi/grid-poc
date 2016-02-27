var _ = require('lodash');
var React = require('react/addons');  // react + addons
var TestUtils = React.addons.TestUtils;


var Cell = require('../../../app/Grid/Components/Cell');
var Manipulator = require('../../../app/Grid/Manipulator');
var Resizer = require('../../../app/Grid/Components/Resizer');
var Row = require('../../../app/Grid/Components/Row');
var Store = require('../../../app/Grid/Store');

var Utils = require('../../Utils');
var componentUtils = require('./Utils');


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
        Manipulator.setIds(testGrid);
        gridRow = testGrid.querySelector('row');

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

    it("should be able to get its grid cells if no resizers", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        var cells = component.getCells();
        var expectedCells = _.toArray(gridRow.querySelectorAll(':scope > cell, :scope > resizer'));
        expect(cells).toEqual(expectedCells);
        expect(cells.length).toEqual(2);
        expect(cells[0].tagName).toEqual('cell');
        expect(cells[1].tagName).toEqual('cell');
    });

    it("should be able to get its grid cells with resizers if any", function() {
        Manipulator.addResizers(testGrid);
        Manipulator.setIds(testGrid);

        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        var cells = component.getCells();
        var expectedCells = _.toArray(gridRow.querySelectorAll(':scope > cell, :scope > resizer'));
        expect(cells).toEqual(expectedCells);
        expect(cells.length).toEqual(3);
        expect(cells[0].tagName).toEqual('cell');
        expect(cells[1].tagName).toEqual('resizer');
        expect(cells[2].tagName).toEqual('cell');
    });

    it("should know if it's a placeolder or not", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        gridRow = testGrid.querySelector('row[type=placeholder]');
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isPlaceholder()).toBe(true);

        gridRow = testGrid.querySelector('row:not([type=placeholder])');
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

        // default relative size => flex-grow=1
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*1\b/);

        // update the relativeSize to see if it's taken into account
        gridRow.setAttribute('relativeSize', 2);
        component.forceUpdate();
        // new relative size of the node, check the rendered div
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*2\b/);
    });

    it("should render a placeholder", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        var placeholderGridRow = testGrid.querySelector('row[type=placeholder]');
        var element = React.createElement(Row, {node: placeholderGridRow});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-row')).toBe(true);
        expect(domNode.classList.contains('grid-row-placeholder')).toBe(true);
    });

    it("should be able to render its cells if no resizers", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        var cells = component.renderCells();
        expect(cells.length).toEqual(2);
        expect(TestUtils.isElementOfType(cells[0], Cell)).toBe(true);
        expect(TestUtils.isElementOfType(cells[1], Cell)).toBe(true);
    });

    it("should be able to render its cells and resizers if any", function() {
        Manipulator.addResizers(testGrid);
        Manipulator.setIds(testGrid);

        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        var cells = component.renderCells();
        expect(cells.length).toEqual(3);
        expect(TestUtils.isElementOfType(cells[0], Cell)).toBe(true);
        expect(TestUtils.isElementOfType(cells[1], Resizer)).toBe(true);
        expect(TestUtils.isElementOfType(cells[2], Cell)).toBe(true);
    });

    it("should render sub components", function() {
        var element = React.createElement(Row, {node: gridRow});
        var component = componentUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(3);  // including self
        expect(componentUtils.countModules(component)).toEqual(3);
        expect(componentUtils.countSubGrids(component)).toEqual(1);
    });

});