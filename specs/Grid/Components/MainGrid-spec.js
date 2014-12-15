var _ = require('lodash');
var React = require('react/addons');  // react + addons
var TestUtils = React.addons.TestUtils;

var Actions = require('../../../app/Grid/Actions.js');
var Manipulator = require('../../../app/Grid/Manipulator.js');
var Row = require('../../../app/Grid/Components/Row.jsx');
var Store = require('../../../app/Grid/Store.js');

var MainGrid = require('../../../app/Grid/Components/MainGrid.jsx');

var Utils = require('../../Utils.js');
var componentUtils = require('./Utils.js');


describe("Grid.Components.MainGrid", function() {
    var uniqueIdMock;

    // main grid defined in beforeEach
    var testGrid;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();

        setTimeout(done, 0.01);
    });

    it("should have a grid", function() {
        var grid = Store.getGrid('Test grid');
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.props.node).toBe(testGrid);
    });

    it("should have a grid name", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.state.gridName).toEqual('Test grid');
    });

    it("should access its own grid as the main grid", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(testGrid.getAttribute('id'));
    });

    it("should be able to get its grid rows", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        var rows =component.getRows();
        var expectedRows = _.toArray(testGrid.querySelectorAll(':scope > content > rows'));
        expect(rows).toEqual(expectedRows);
    });

    it("should render a grid", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-container')).toBe(true);
        expect(domNode.childNodes.length).toEqual(2);
        var navDomNode = domNode.childNodes[0];
        expect(navDomNode.tagName).toEqual('NAV');
        expect(navDomNode.classList.contains('grid-toolbar')).toBe(true);
        var gridDomNode = domNode.childNodes[1];
        expect(gridDomNode.classList.contains('grid')).toBe(true);
        expect(gridDomNode.classList.contains('grid-main')).toBe(true);
    });

    it("should be able to render its rows", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        var rows = component.renderRows();
        expect(rows.length).toEqual(2);
        _(rows).forEach(function(row) {
            expect(TestUtils.isElementOfType(row, Row)).toBe(true);
        });
    });

    it("should know if it's in design mode", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.inDesignMode()).toBe(true);
    });

    it("should render sub components", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(4);
        expect(componentUtils.countModules(component)).toEqual(6);
        expect(componentUtils.countSubGrids(component)).toEqual(1);
    });

    it("should change when toggling design mode", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getDOMNode().classList.contains('grid-container-design-mode')).toBe(false);

        spyOn(component, 'forceUpdate').and.callThrough();
        component.toggleDesignMode();

        // give some time to re-render
        setTimeout(function() {
            expect(component.forceUpdate).toHaveBeenCalled();
            expect(component.forceUpdate.calls.count()).toEqual(1);

        expect(component.getDOMNode().classList.contains('grid-container-design-mode')).toBe(true);

            // should have placeholders
            // 4 (before each row) + 2 (end of each grid) + 6 ("module") * 2 (per module)
            expect(componentUtils.countRowPlaceholders(component)).toEqual(18);
            // 6 (1 for each rowPH except module) + 7 (before each cell) + 4 (end of each row) + 6 ("module") * 4 (per module)
            expect(componentUtils.countCellPlaceholders(component)).toEqual(41);

            // should have more components, as modules are wrapped in subgrids
            // 4 original rows + 18 placeholders + 6 ("module") * 1 (per module)
            expect(componentUtils.countRows(component)).toEqual(28);
            // 6 original modules
            expect(componentUtils.countModules(component)).toEqual(6);
            // 1 original + 6 ("module") * 1 (per module)
            expect(componentUtils.countSubGrids(component)).toEqual(7);

            done();
        }, 0.01);
    });
});
