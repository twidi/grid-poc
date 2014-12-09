var _ = require('lodash');
var React = require('react/addons');  // react + addons
var TestUtils = React.addons.TestUtils;

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
        subGrid = testGrid.querySelector('cells[type=grid]');

        setTimeout(done, 0.01);
    });

    it("should access its main grid", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(subGrid.getAttribute('id'));
    });

    it("should be able to get its grid rows", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = TestUtils.renderIntoDocument(element);
        var rows =component.getRows();
        var expectedRows = _.toArray(subGrid.querySelectorAll(':scope > content > rows'));
        expect(rows).toEqual(expectedRows);
    });

    it("should be able to render its rows", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = TestUtils.renderIntoDocument(element);
        var rows = component.renderRows();
        expect(rows.length).toEqual(2);
        _(rows).forEach(function(row) {
            expect(TestUtils.isElementOfType(row, Row)).toBe(true);
        });
    });

    it("should render sub components", function() {
        var element = React.createElement(SubGrid, {node: subGrid});
        var component = TestUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(2);
        expect(componentUtils.countModules(component)).toEqual(2);
        expect(componentUtils.countSubGrids(component)).toEqual(1);  // self!
    });

});