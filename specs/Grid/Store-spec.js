var _ = require('lodash');

var Actions = require('../../app/Grid/Actions.js');
var Manipulator = require('../../app/Grid/Manipulator.js');
var Store = require('../../app/Grid/Store.js');

var Utils = require('../Utils.js');


describe("Grid.Store", function() {
    var uniqueIdMock;

    beforeEach(function() {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();
    });

    it("should raise if a grid is not available", function() {
        expect(function() {
            Store.getGrid('bar');
        }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <bar>");
    });

    it("should return a grid by its name", function(done) {
        var grid = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(grid);

        setTimeout(function() {
            expect(Store.getGrid('foo')).toBe(grid);
            done();
        });
    });

    it("should return a node by its id", function(done) {
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');
        Manipulator.setIds(grid);

        Actions.addGrid(grid);

        setTimeout(function() {
            _(_.toArray(grid.querySelectorAll('*')).concat([grid])).forEach(function(node) {
                expect(Store.getGridNodeById('foo', node.getAttribute('id'))).toBe(node);
            });

            done();
        });

    });

    it("should return the main grid of a subnode", function() {
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');
        _(grid.querySelectorAll('*')).forEach(function(node) {
            expect(Store.getMainGrid(node)).toBe(grid);
        });
    });

    it("should return the main grid as its main grid", function() {
        var grid = Manipulator.createBaseGrid('foo', 5);
        expect(Store.getMainGrid(grid)).toBe(grid);
    });


    it("should return the id attribute of a node", function() {
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');
        Manipulator.setIds(grid);
        _(grid.querySelectorAll('*')).forEach(function(node) {
            expect(Store.getNodeId(node)).toBe(node.getAttribute('id'));
        });
        expect(Store.getNodeId(grid)).toBe(grid.getAttribute('id'));
    });


});