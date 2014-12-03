var TestUtils = require('react-addons').TestUtils;

var Actions = require('./../../../app/Grid/Actions.js');
var Manipulator = require('./../../../app/Grid/Manipulator.js');
var Store = require('./../../../app/Grid/Store.js');

var Grid = require('./../../../app/Grid/Components/Grid.jsx');


describe("Grid.Components.Grid", function() {

    beforeEach(function() {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();
    });


    it("should draw a grid", function(done) {
        var grid = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(grid);

        setTimeout(function() {

            var gridComponent = TestUtils.renderIntoDocument(Grid({name: 'foo'}));

            expect(gridComponent.props.name).toEqual('foo');
            expect(gridComponent.state.grid).toBe(grid);

            done();

        }, 0.01);
    });

});
