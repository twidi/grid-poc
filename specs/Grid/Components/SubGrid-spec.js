var _ = require('lodash');
var React = require('react/addons');  // react + addons
var TestUtils = React.addons.TestUtils;

var Manipulator = require('../../../app/Grid/Manipulator.js');

var Row = require('../../../app/Grid/Components/Row.jsx');
var Store = require('../../../app/Grid/Store.js');
var SubGrid = require('../../../app/Grid/Components/SubGrid.jsx');

var Utils = require('../../Utils.js');
var componentUtils = require('./Utils.js');


describe("Grid.Components.SubGrid", function() {
    var uniqueIdMock;

    // main grid, and its subgrid defined in beforeEach
    var testGrid;
    var subGrid;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        subGrid = testGrid.querySelector('cell[type=grid]');

        setTimeout(done, 0.01);
    });

    afterEach(function() {
        componentUtils.unmountAllComponents();
    });

    it("should access its main grid", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(subGrid.getAttribute('id'));
    });

    it("should get the main grid name", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it("should get the design mode step", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it("should know if it's in design mode", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it("should be able to get its grid rows", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        var rows =component.getRows();
        var expectedRows = _.toArray(subGrid.querySelectorAll(':scope > content > row'));
        expect(rows).toEqual(expectedRows);
    });

    it("should be able to render its rows", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        var rows = component.renderRows();
        expect(rows.length).toEqual(2);
        _(rows).forEach(function(row) {
            expect(TestUtils.isElementOfType(row, Row)).toBe(true);
        });
    });

    it("should render a grid", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid')).toBe(true);
        expect(domNode.classList.contains('grid-main')).toBe(false);
        expect(domNode.classList.contains('grid-last-level-with-placeholders')).toBe(false);
    });

    it("should have a specific class when its the deapest grid", function() {
        Manipulator.addPlaceholders(testGrid);
        subGrid = testGrid.querySelector('cell[type=grid] cell[type=grid]');
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid')).toBe(true);
        expect(domNode.classList.contains('grid-main')).toBe(false);
        expect(domNode.classList.contains('grid-last-level-with-placeholders')).toBe(true);
    });

    it("should render sub components", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(2);
        expect(componentUtils.countModules(component)).toEqual(2);
        expect(componentUtils.countSubGrids(component)).toEqual(1);  // self!
    });

});