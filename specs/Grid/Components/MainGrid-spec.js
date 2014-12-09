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

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();

        setTimeout(done, 0.01);
    });

    it("should have a grid", function() {
        var grid = Store.getGrid('Test grid');
        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));
        expect(component.props.node).toBe(testGrid);
    });

    it("should have a grid name", function() {
        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));;
        expect(component.state.gridName).toEqual('Test grid');
    });

    it("should access its own grid as the main grid", function() {
        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));;
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));;
        expect(component.getNodeId()).toBe(testGrid.getAttribute('id'));
    });

    it("should be able to get its grid rows", function() {
        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));;
        var rows =component.getRows();
        var expectedRows = _.toArray(testGrid.querySelectorAll(':scope > content > rows'));
        expect(rows).toEqual(expectedRows);
    });

    it("should be able to render its rows", function() {
        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));;
        var rows = component.renderRows();
        expect(rows.length).toEqual(2);
        _(rows).forEach(function(row) {
            expect(TestUtils.isElementOfType(row, Row)).toBe(true);
        });
    });

    it("should know if it's in design mode", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));;
        expect(component.inDesignMode()).toBe(true);
    });

    it("should render sub components", function() {
        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));;
        expect(componentUtils.countRows(component)).toEqual(4);
        expect(componentUtils.countModules(component)).toEqual(6);
        expect(componentUtils.countSubGrids(component)).toEqual(1);
    });

    it("should change when toggling design mode", function(done) {
        var component = TestUtils.renderIntoDocument(MainGrid({node: testGrid}));;
        expect(component.getDOMNode().textContent).toMatch(/I am NOT in design mode/);

        spyOn(component, 'forceUpdate').and.callThrough();
        component.toggleDesignMode();

        // give some time to re-render
        setTimeout(function() {
            expect(component.forceUpdate).toHaveBeenCalled();
            expect(component.forceUpdate.calls.count()).toEqual(1);

            var textContent = component.getDOMNode().textContent
            expect(textContent).toMatch(/I am in design mode/);

            // should have placeholders
            expect(componentUtils.countRowPlaceholders(component)).toEqual(6);
            expect(componentUtils.countCellPlaceholders(component)).toEqual(17);

            // should still have same number of default components
            expect(componentUtils.countRows(component)).toEqual(4);
            expect(componentUtils.countModules(component)).toEqual(6);
            expect(componentUtils.countSubGrids(component)).toEqual(1);

            done();
        }, 0.01);
    });
});
