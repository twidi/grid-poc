var TestUtils = require('react-addons').TestUtils;

var Actions = require('./../../../app/Grid/Actions.js');
var Manipulator = require('./../../../app/Grid/Manipulator.js');
var Store = require('./../../../app/Grid/Store.js');

var Grid = require('./../../../app/Grid/Components/Grid.jsx');


describe("Grid.Components.Grid", function() {

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we add a grid "foo"
        var grid = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(grid);

        setTimeout(function() {
            done();
        }, 0.01);
    });

    it("should have grid name", function() {
        var gridComponent = TestUtils.renderIntoDocument(Grid({name: 'foo'}));;
        expect(gridComponent.props.name).toEqual('foo');
    });

    it("should get a grid from the store", function() {
        var gridComponent = TestUtils.renderIntoDocument(Grid({name: 'foo'}));
        var expectedGrid = Store.getGrid('foo');
        var grid = gridComponent.getGrid();
        expect(grid).toBe(expectedGrid);
    });

    it("should know if it's in design mode", function() {
        var gridComponent = TestUtils.renderIntoDocument(Grid({name: 'foo'}));
        var grid = gridComponent.getGrid();
        Manipulator.addPlaceholders(grid);
        expect(gridComponent.designMode()).toBe(true);
    });

    it("should change when toggling design mode", function(done) {
        var gridComponent = TestUtils.renderIntoDocument(Grid({name: 'foo'}));
        expect(gridComponent.getDOMNode().innerText).toMatch(/I am NOT in design mode/);

        gridComponent.toggleDesignMode();

        // give some time to re-render
        setTimeout(function() {
            expect(gridComponent.getDOMNode().innerText).toMatch(/I am in design mode/);
            done();
        }, 0.01);
    });
});
