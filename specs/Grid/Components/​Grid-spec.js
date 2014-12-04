var TestUtils = require('react-addons').TestUtils;

var Actions = require('./../../../app/Grid/Actions.js');
var Manipulator = require('./../../../app/Grid/Manipulator.js');
var Store = require('./../../../app/Grid/Store.js');

var Grid = require('./../../../app/Grid/Components/Grid.jsx');


describe("Grid.Components.Grid", function() {

    // main grid defined in beforeEach
    var gridFoo;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we add a grid "foo"
        gridFoo = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(gridFoo);

        setTimeout(function() {
            done();
        }, 0.01);
    });

    it("should have a grid", function() {
        var gridComponent = TestUtils.renderIntoDocument(Grid({grid: gridFoo}));
        expect(gridComponent.props.grid).toBe(gridFoo);
    });

    it("should have a grid name", function() {
        var gridComponent = TestUtils.renderIntoDocument(Grid({grid: gridFoo}));;
        expect(gridComponent.state.gridName).toEqual('foo');
    });

    it("should know if it's in design mode", function() {
        var gridComponent = TestUtils.renderIntoDocument(Grid({grid: gridFoo}));;
        Manipulator.addPlaceholders(gridFoo);
        expect(gridComponent.designMode()).toBe(true);
    });

    it("should change when toggling design mode", function(done) {
        var gridComponent = TestUtils.renderIntoDocument(Grid({grid: gridFoo}));;
        expect(gridComponent.getDOMNode().textContent).toMatch(/I am NOT in design mode/);

        gridComponent.toggleDesignMode();

        // give some time to re-render
        setTimeout(function() {
            expect(gridComponent.getDOMNode().textContent).toMatch(/I am in design mode/);
            done();
        }, 0.01);
    });
});
