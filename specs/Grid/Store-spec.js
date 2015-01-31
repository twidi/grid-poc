var _ = require('lodash');

var Actions = require('../../app/Grid/Actions.js');
var Manipulator = require('../../app/Grid/Manipulator.js');
var Store = require('../../app/Grid/Store.js');

var customMatchers = require('./custom-matchers.js');
var Utils = require('../Utils.js');


describe("Grid.Store", function() {
    var uniqueIdMock;

    beforeEach(function() {
        jasmine.addMatchers(customMatchers);

        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();
    });

    var createSimpleGrid = function() {
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');
        Manipulator.setIds(grid);
        Store.__private.addGrid(grid);
        return grid;
    };

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

            var gridEntry = Store.__private.getGridEntry('foo');
            expect(gridEntry.name).toEqual('foo');
            expect(gridEntry.designModeStep).toEqual('disabled');
            expect(gridEntry.backups).toEqual({});
            expect(gridEntry.nodes).toEqual({});
            expect(gridEntry.hoveringTimeout).toBe(null);


            done();
        });
    });

    it("should return a node by its id", function() {
        var grid = createSimpleGrid();
        _(_.toArray(grid.querySelectorAll('*')).concat([grid])).forEach(function(node) {
            expect(Store.getGridNodeById('foo', node.getAttribute('id'))).toBe(node);
        });

    });

    it("should return the main grid of a node", function() {
        var grid = createSimpleGrid();
        _(grid.querySelectorAll('*')).forEach(function(node) {
            expect(Store.getMainGrid(node)).toBe(grid);
        });
        expect(Store.getMainGrid(grid)).toBe(grid);
    });


    it("should return the id attribute of a node", function() {
        var grid = createSimpleGrid();
        _(grid.querySelectorAll('*')).forEach(function(node) {
            expect(Store.getNodeId(node)).toBe(node.getAttribute('id'));
        });
        expect(Store.getNodeId(grid)).toBe(grid.getAttribute('id'));
    });

    it("should return the name of the main grid for a node", function() {
        var grid = createSimpleGrid();
        _(grid.querySelectorAll('*')).forEach(function(node) {
            expect(Store.getMainGridName(node)).toBe('foo');
        });
        expect(Store.getMainGridName(grid)).toBe('foo');
    });

    it("should return the design mode step for a node", function() {
        var grid = createSimpleGrid();
        expect(Store.getDesignModeStep('foo')).toBe('disabled');
    });

    it("should tell if the grid is in dragging mode", function() {
        var grid = createSimpleGrid();
        expect(Store.isDragging('foo')).toBe(false);
        // it's in dragging mode if there is a node currently dragged
        Store.__private.grids['foo'].nodes.dragging = true;
        expect(Store.isDragging('foo')).toBe(true);
    });

    it("should tell if it's the dragging cell", function() {
        var grid = createSimpleGrid();

        var row  = grid.querySelector('row');
        var cell = grid.querySelector('cell[type=module]');
        var otherCell = Manipulator.addCell(row, null, 'module');

        expect(Store.isDraggingCell('foo', cell)).toBe(false);

        // it's the content that is saved
        Store.__private.grids['foo'].nodes.dragging = cell.querySelector(':scope > content');
        expect(Store.isDraggingCell('foo', cell)).toBe(true);

        // check another cell
        expect(Store.isDraggingCell('foo', otherCell)).toBe(false);
    });

    it("should tell if the grid is in hovering mode", function() {
        var grid = createSimpleGrid();
        expect(Store.isHovering('foo')).toBe(false);
        // it's in dragging mode if there is a node currently hovered
        Store.__private.grids['foo'].nodes.hovering = true;
        expect(Store.isHovering('foo')).toBe(true);
    });

    it("should tell if it's the hovering cell", function() {
        var grid = createSimpleGrid();

        var row  = grid.querySelector('row');
        var cell = grid.querySelector('cell[type=module]');
        var otherCell = Manipulator.addCell(row, null, 'module');

        expect(Store.isHoveringPlaceholder('foo', cell)).toBe(false);

        Store.__private.grids['foo'].nodes.hovering = cell;
        expect(Store.isHoveringPlaceholder('foo', cell)).toBe(true);

        // check another cell
        expect(Store.isHoveringPlaceholder('foo', otherCell)).toBe(false);
    });

    it("should tell if a grid has a subgrid", function() {
        var grid = Manipulator.createBaseGrid('foo');
        Store.__private.addGrid(grid);
        expect(Store.containsSubGrid(grid)).toBe(false);

        var row = Manipulator.addRow(grid);
        Manipulator.addCell(row, null, 'module');
        expect(Store.containsSubGrid(grid)).toBe(false);

        var subGrid = Manipulator.addCell(row, null, 'grid');
        expect(Store.containsSubGrid(grid)).toBe(true);
        expect(Store.containsSubGrid(subGrid)).toBe(false);

        row = Manipulator.addRow(subGrid);
        Manipulator.addCell(row, null, 'module');
        expect(Store.containsSubGrid(grid)).toBe(true);
        expect(Store.containsSubGrid(subGrid)).toBe(false);

        var subSubGrid = Manipulator.addCell(row, null, 'grid');
        expect(Store.containsSubGrid(grid)).toBe(true);
        expect(Store.containsSubGrid(subGrid)).toBe(true);
        expect(Store.containsSubGrid(subSubGrid)).toBe(false);
    });

    it("should tell if the grid has placeholders", function() {
        var grid = createSimpleGrid();
        expect(Store.hasPlaceholders('foo')).toBe(false);
        Manipulator.addPlaceholders(grid);
        expect(Store.hasPlaceholders('foo')).toBe(true);
    });

    it("should tell if the grid has resizers", function() {
        var grid = createSimpleGrid();
        expect(Store.hasResizers('foo')).toBe(false);
        Manipulator.addResizers(grid);
        expect(Store.hasResizers('foo')).toBe(true);
    });

    describe('Private api', function() {
        it("should return a grid entry", function() {
            var grid = createSimpleGrid();

            var entry = Store.__private.getGridEntry('foo');

            expect(entry.name).toBe('foo');
            expect(entry.grid).toBe(grid);
            expect(entry.designModeStep).toEqual('disabled');
            expect(entry.backups).toEqual({});
            expect(entry.nodes).toEqual({});
            expect(entry.hoveringTimeout).toBe(null);

            expect(_.size(entry)).toEqual(6);
        });

        it("should raise if a grid entry is not available", function() {
            expect(function() {
                Store.__private.getGridEntry('bar');
            }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <bar>");
        });

        it("should raise if a asking to change design mode step for a grid that doesn't exist", function() {
            expect(function() {
                Store.__private.changeDesignModeStep('foo', 'bar', true);
            }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <foo>");
        });

        it("should raise if a design mode step doesn't exist", function() {
            var grid = createSimpleGrid();

            expect(function() {
                Store.__private.changeDesignModeStep('foo', 'bar', true);
            }).toThrowError(Store.Exceptions.InvalidDesignModeStep, "The given design mode step <bar> is not a valid one");

        });

        it("should ignore setting the current design mode step", function() {
            var grid = createSimpleGrid();
            ['disabled', 'enabled', 'dragging', 'prehovering', 'hovering'].forEach(function(step) {
                Store.__private.setDesignModeStep('foo', step);
                expect(function() {
                    Store.__private.changeDesignModeStep('foo', step, true);
                }).not.toThrowError(Store.Exceptions.InvalidDesignModeStep);
                expect(Store.__private.getDesignModeStep('foo')).toEqual(step);
            });
        });

        it("should allow changing ony allowed design mode steps", function() {
            var grid = createSimpleGrid();

            var tests = {
                'disabled': {
                    'allowed': ['enabled'],
                    'denied': ['dragging', 'prehovering', 'hovering'],
                },
                'enabled': {
                    'allowed': ['disabled', 'dragging'],
                    'denied': ['prehovering', 'hovering'],
                },
                'dragging': {
                    'allowed': ['enabled', 'prehovering'],
                    'denied': ['disabled', 'hovering'],
                },
                'prehovering': {
                    'allowed': ['dragging', 'hovering', 'enabled'],
                    'denied': ['disabled'],
                },
                'hovering': {
                    'allowed': ['dragging', 'enabled'],
                    'denied': ['disabled', 'prehovering'],
                },
            };

            _.each(tests, function(rules, initialStep) {
                // check that setting denied new steps raises an error
                rules.denied.forEach(function(invalidStep) {
                    Store.__private.setDesignModeStep('foo', initialStep);

                    expect(function() {
                        Store.__private.changeDesignModeStep('foo', invalidStep, true);
                    }).toThrowError(Store.Exceptions.InvalidDesignModeStep, "The given design mode step <" + invalidStep + "> is not valid step to go after the current one which is <" + initialStep + ">");

                    // we should still have the same initial step
                    expect(Store.__private.getDesignModeStep('foo')).toEqual(initialStep);
                });

                // check that setting allowed steps does not raise any errors
                rules.allowed.forEach(function(validStep) {
                    Store.__private.setDesignModeStep('foo', initialStep);

                    expect(function() {
                        Store.__private.changeDesignModeStep('foo', validStep, true);
                    }).not.toThrowError(Store.Exceptions.InvalidDesignModeStep);

                    // we should have the new step
                    expect(Store.__private.getDesignModeStep('foo')).toEqual(validStep);
                });

            });
        });

        describe("it should add placeholders if missing when changing design mode step", function() {
            // allowed changes that should end with placeholders
            var tests = {
                'enabled': ['dragging'],
                'dragging': ['prehovering'],
                'prehovering': ['dragging'],
                'hovering': ['dragging']
            };

            _.each(tests, function(steps, initialStep) {
                steps.forEach(function(step) {
                    it("should add/keep them from `" + initialStep + "` to `" + step + "`", function(){
                        var grid = createSimpleGrid();

                        spyOn(Manipulator, 'addPlaceholders').and.callThrough();
                        spyOn(Manipulator, 'removePlaceholders').and.callThrough();

                        // test going from `initialStep` asking to not change the grid
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step, true);

                        expect(Manipulator.hasPlaceholders(grid)).toBe(false, 'dontManageGrid=true');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'dontManageGrid=true');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'dontManageGrid=true');

                        // test going from `initialStep` asking to change the grid (the default)
                        Manipulator.addPlaceholders.calls.reset();
                        Manipulator.removePlaceholders.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        expect(Manipulator.hasPlaceholders(grid)).toBe(true, 'dontManageGrid=false');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(1, 'dontManageGrid=false');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'dontManageGrid=false');

                        // same check but the grid still have placeholders
                        Manipulator.addPlaceholders.calls.reset();
                        Manipulator.removePlaceholders.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        // nothing changed
                        expect(Manipulator.hasPlaceholders(grid)).toBe(true, 'already have placeholders');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'already have placeholders');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'already have placeholders');
                    });
                });
            });
        });

        describe("it should remove placeholders if present when changing design mode step", function() {
            // allowed changes that should end with no placeholders
            var tests = {
                'disabled': ['enabled'],
                'enabled': ['disabled', 'resizing'],
                'resizing': ['enabled'],
                'dragging': ['enabled'],
                'prehovering': ['enabled', 'hovering'],
                'hovering': ['enabled']
            };

            _.each(tests, function(steps, initialStep) {
                steps.forEach(function(step) {
                    it("should remove/ignore them from `" + initialStep + "` to `" + step + "`", function(){
                        var grid = createSimpleGrid();
                        Manipulator.addPlaceholders(grid);

                        spyOn(Manipulator, 'addPlaceholders').and.callThrough();
                        spyOn(Manipulator, 'removePlaceholders').and.callThrough();

                        // test going from `initialStep` asking to not change the grid
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step, true);

                        expect(Manipulator.hasPlaceholders(grid)).toBe(true, 'dontManageGrid=true');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'dontManageGrid=true');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'dontManageGrid=true');

                        // test going from `initialStep` asking to change the grid (the default)
                        Manipulator.addPlaceholders.calls.reset();
                        Manipulator.removePlaceholders.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        expect(Manipulator.hasPlaceholders(grid)).toBe(false, 'dontManageGrid=false');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'dontManageGrid=false');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(1, 'dontManageGrid=false');

                        // same check but the grid still have placeholders
                        Manipulator.addPlaceholders.calls.reset();
                        Manipulator.removePlaceholders.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        // nothing changed
                        expect(Manipulator.hasPlaceholders(grid)).toBe(false, 'already have no nore placeholders');
                        expect(Manipulator.addPlaceholders.calls.count()).toEqual(0, 'already have no nore placeholders');
                        expect(Manipulator.removePlaceholders.calls.count()).toEqual(0, 'already have no nore placeholders');
                    });
                });
            });
        });

       describe("it should add resizers if missing when changing design mode step", function() {
            // allowed changes that should end with resizers
            var tests = {
                'disabled': ['enabled'],
                'enabled': ['resizing'],
                'resizing': ['enabled'],
                'dragging': ['enabled'],
                'prehovering': ['enabled'],
                'hovering': ['enabled']
            };

            _.each(tests, function(steps, initialStep) {
                steps.forEach(function(step) {
                    it("should add/keep them from `" + initialStep + "` to `" + step + "`", function(){
                        var grid = createSimpleGrid();

                        spyOn(Manipulator, 'addResizers').and.callThrough();
                        spyOn(Manipulator, 'removeResizers').and.callThrough();

                        // test going from `initialStep` asking to not change the grid
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step, true);

                        expect(Manipulator.hasResizers(grid)).toBe(false, 'dontManageGrid=true');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'dontManageGrid=true');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'dontManageGrid=true');

                        // test going from `initialStep` asking to change the grid (the default)
                        Manipulator.addResizers.calls.reset();
                        Manipulator.removeResizers.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        expect(Manipulator.hasResizers(grid)).toBe(true, 'dontManageGrid=false');
                        expect(Manipulator.addResizers.calls.count()).toEqual(1, 'dontManageGrid=false');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'dontManageGrid=false');

                        // same check but the grid still have resizers
                        Manipulator.addResizers.calls.reset();
                        Manipulator.removeResizers.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        // nothing changed
                        expect(Manipulator.hasResizers(grid)).toBe(true, 'already have resizers');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'already have resizers');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'already have resizers');
                    });
                });
            });
        });

        describe("it should remove resizers if present when changing design mode step", function() {
            // allowed changes that should end with no resizers
            var tests = {
                'enabled': ['disabled', 'dragging'],
                'dragging': ['prehovering'],
                'prehovering': ['dragging', 'hovering'],
                'hovering': ['dragging']
            };

            _.each(tests, function(steps, initialStep) {
                steps.forEach(function(step) {
                    it("should remove/ignore them from `" + initialStep + "` to `" + step + "`", function(){
                        var grid = createSimpleGrid();
                        Manipulator.addResizers(grid);

                        spyOn(Manipulator, 'addResizers').and.callThrough();
                        spyOn(Manipulator, 'removeResizers').and.callThrough();

                        // test going from `initialStep` asking to not change the grid
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step, true);

                        expect(Manipulator.hasResizers(grid)).toBe(true, 'dontManageGrid=true');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'dontManageGrid=true');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'dontManageGrid=true');

                        // test going from `initialStep` asking to change the grid (the default)
                        Manipulator.addResizers.calls.reset();
                        Manipulator.removeResizers.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        expect(Manipulator.hasResizers(grid)).toBe(false, 'dontManageGrid=false');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'dontManageGrid=false');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(1, 'dontManageGrid=false');

                        // same check but the grid still have resizers
                        Manipulator.addResizers.calls.reset();
                        Manipulator.removeResizers.calls.reset();
                        Store.__private.setDesignModeStep('foo', initialStep);
                        Store.__private.changeDesignModeStep('foo', step);

                        // nothing changed
                        expect(Manipulator.hasResizers(grid)).toBe(false, 'already have no nore resizers');
                        expect(Manipulator.addResizers.calls.count()).toEqual(0, 'already have no nore resizers');
                        expect(Manipulator.removeResizers.calls.count()).toEqual(0, 'already have no nore resizers');
                    });
                });
            });
        });

        it("should set the design step mode", function() {
            // without grid, should raise
            expect(function() {
                Store.__private.setDesignModeStep('bar', 'enabled');
            }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <bar>");

            // create a grid
            var grid = createSimpleGrid();

            // test each entry (default mode is "disabled" so we don't start with it)
            ['enabled', 'dragging', 'prehovering', 'hovering', 'disabled'].forEach(function(step) {
                Store.__private.setDesignModeStep('foo', step);
                expect(Store.__private.grids['foo'].designModeStep).toEqual(step);
            });

        })

        it("should check consistency of grid name and node", function() {

            // bad for inexistent grid
            expect(function() {
                Store.__private.checkConsistency('absent');
            }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <absent>");
            // bad for inexistent grid
            expect(function() {
                Store.__private.checkConsistency('absent', node);
            }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <absent>");

            var grid = createSimpleGrid();
            var node = grid.querySelector('cell');

            // ok for grid+node
            expect(function() {
                Store.__private.checkConsistency('foo', node);
            }).not.toThrow();

            // create a new grid, but not yet in the store
            var grid2 = Manipulator.createBaseGrid('bar', 5);
            var node2 = Manipulator.addCell(Manipulator.addRow(grid2), null, 'module');

            expect(function() {
                Store.__private.checkConsistency('bar');
            }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <bar>");
            expect(function() {
                Store.__private.checkConsistency('bar', node2);
            }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <bar>");

            // now add the grid in the store
            Actions.addGrid(grid2);

            // ok for grid2+node2
            expect(function() {
                Store.__private.checkConsistency('bar', node2);
            }).not.toThrow();

            // bad for node not in the grid
            expect(function() {
                Store.__private.checkConsistency('foo', node2);
            }).toThrowError(Store.Exceptions.Inconsistency, "The given cell is not contained in the grid <foo>");

            // ok for valid grid, and no node
            expect(function() {
                Store.__private.checkConsistency('bar');
            }).not.toThrow();
        });

        it("should backup a grid", function() {
            var grid = createSimpleGrid();

            // save a first backup
            Store.__private.backupGrid('foo', 'first');
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(1);

            // the original grid is backuped
            expect(Store.__private.grids['foo'].backups['first']).toBe(grid);
            // the official grid is the clone
            var firstClone = Store.__private.grids['foo'].grid;
            expect(Store.getGrid('foo')).toBe(firstClone);
            // both are different objects
            expect(firstClone).not.toBe(grid);
            // check that both grids have the same xml
            expect(firstClone).toEqualXML(grid)

            // we can save another backup
            Store.__private.backupGrid('foo', 'second');
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(2);

            // the original grid is still here
            expect(Store.__private.grids['foo'].backups['first']).toBe(grid);
            // the first clone is backuped
            expect(Store.__private.grids['foo'].backups['second']).toBe(firstClone);
            // the official grid is the second clone
            var secondClone = Store.__private.grids['foo'].grid;
            expect(Store.getGrid('foo')).toBe(secondClone);
            // there are all different objects
            expect(secondClone).not.toBe(grid);
            expect(secondClone).not.toBe(firstClone);
            // but they have the same xml
            expect(secondClone).toEqualXML(firstClone);

        });

        it("should restore a grid", function() {

            var grid = createSimpleGrid();

            // make a backup
            Store.__private.backupGrid('foo', 'first');
            var firstClone = Store.__private.grids['foo'].grid;

            // do nothing if restoring inexistent backup
            var restored = Store.__private.restoreGrid('foo', 'fake');
            expect(restored).toBe(undefined);
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(1);
            expect(Store.getGrid('foo')).toBe(firstClone);

            // restore backup
            restored = Store.__private.restoreGrid('foo', 'first');

            // the original grid should be the current one
            expect(Store.getGrid('foo')).toBe(grid);
            expect(restored).toBe(grid);

            // we should have no backup left
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(0);

            // make a new first backup
            Store.__private.backupGrid('foo', 'first');
            firstClone = Store.__private.grids['foo'].grid;
            // and another
            Store.__private.backupGrid('foo', 'second');

            // first restore
            restored = Store.__private.restoreGrid('foo', 'second');
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(1);

            // the first clone should be the current one
            expect(Store.getGrid('foo')).toBe(firstClone);
            expect(restored).toBe(firstClone);

            // second restore
            restored = Store.__private.restoreGrid('foo', 'first');
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(0);

            // the original grid should be the current one
            expect(Store.getGrid('foo')).toBe(grid);
            expect(restored).toBe(grid);
        });

        it("should clear a backup grid", function() {
            var grid = createSimpleGrid();

            // should do nothing if no such backup
            expect(function() {
                Store.__private.clearBackupedGrid('fake');
            }).not.toThrow();
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(0);

            Store.__private.backupGrid('foo', 'first');
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(1);

            Store.__private.clearBackupedGrid('foo', 'first');
            expect(_.size(Store.__private.grids['foo'].backups)).toEqual(0);
        });

        it("should save a node", function() {
            var grid = createSimpleGrid();
            var row = grid.querySelector('row');
            var cell = grid.querySelector('cell[type=module]');

            Store.__private.saveNode('foo', cell, 'mycell');

            expect(_.size(Store.__private.grids['foo'].nodes)).toEqual(1);
            expect(Store.__private.grids['foo'].nodes['mycell']).toBe(cell);

            Store.__private.saveNode('foo', row, 'myrow');

            expect(_.size(Store.__private.grids['foo'].nodes)).toEqual(2);
            expect(Store.__private.grids['foo'].nodes['mycell']).toBe(cell);
            expect(Store.__private.grids['foo'].nodes['myrow']).toBe(row);

        });

        it("should find a saved node in another grid using its id", function() {
            var grid = createSimpleGrid();
            var row = grid.querySelector('row');
            var cell = grid.querySelector('cell[type=module]');

            // first test without changing the grid
            var clonedRow = Store.__private.getSameNodeInActualGrid('foo', row);
            var clonedCell = Store.__private.getSameNodeInActualGrid('foo', cell);

            expect(clonedRow).not.toBe(undefined);
            expect(clonedRow).toBe(row);

            expect(clonedCell).not.toBe(undefined);
            expect(clonedCell).toBe(cell);

            // make a backup, the main grid is not the initial one
            Store.__private.backupGrid('foo', 'first');

            var clonedRow = Store.__private.getSameNodeInActualGrid('foo', row);
            var clonedCell = Store.__private.getSameNodeInActualGrid('foo', cell);

            expect(clonedRow).not.toBe(undefined);
            expect(clonedRow).not.toBe(row);
            expect(clonedRow).toEqualXML(row);

            expect(clonedCell).not.toBe(undefined);
            expect(clonedCell).not.toBe(cell);
            expect(clonedCell).toEqualXML(cell);

        });

        it("should get the saved node", function() {
            var grid = createSimpleGrid();
            var row = grid.querySelector('row');
            var cell = grid.querySelector('cell[type=module]');

            Store.__private.saveNode('foo', cell, 'mycell');
            Store.__private.saveNode('foo', row, 'myrow');

            // get nodes without changing the grid
            var fetchedCell = Store.__private.getSavedNode('foo', 'mycell');
            expect(fetchedCell).toBe(cell);
            var fetchedRow = Store.__private.getSavedNode('foo', 'myrow');
            expect(fetchedRow).toBe(row);

            // nodes are still saved
            expect(_.size(Store.__private.grids['foo'].nodes)).toEqual(2);

            // get an inexisting node
            expect(function() {
                Store.__private.getSavedNode('foo', 'fake');
            }).not.toThrow();

            // nodes are still saved
            expect(_.size(Store.__private.grids['foo'].nodes)).toEqual(2);

            // now try with an updated grid
            Store.__private.backupGrid('foo', 'first');

            // but asking to not update the nodes to be one in the actual grid
            fetchedCell = Store.__private.getSavedNode('foo', 'mycell', true);
            expect(fetchedCell).toBe(cell);
            fetchedRow = Store.__private.getSavedNode('foo', 'myrow', true);
            expect(fetchedRow).toBe(row);

            // now ask to adapt to be the same node in the actual grid
            fetchedCell = Store.__private.getSavedNode('foo', 'mycell');
            expect(fetchedCell).not.toBe(cell);
            expect(fetchedCell).toEqualXML(cell);
            fetchedRow = Store.__private.getSavedNode('foo', 'myrow');
            expect(fetchedRow).not.toBe(row);
            expect(fetchedRow).toEqualXML(row);

        });

        it("should clear a saved node", function() {
            var grid = createSimpleGrid();
            var row = grid.querySelector('row');
            var cell = grid.querySelector('cell[type=module]');

            Store.__private.saveNode('foo', cell, 'mycell');
            Store.__private.saveNode('foo', row, 'myrow');

            // clear an inexisting node
            expect(function() {
                Store.__private.clearSavedNode('foo', 'fake');
            }).not.toThrow();
            expect(_.size(Store.__private.grids['foo'].nodes)).toEqual(2);

            Store.__private.clearSavedNode('foo', 'mycell');
            expect(_.size(Store.__private.grids['foo'].nodes)).toEqual(1);
            expect(Store.__private.getSavedNode('foo', 'mycell')).toBe(null);
            expect(Store.__private.getSavedNode('foo', 'myrow')).toBe(row);

            Store.__private.clearSavedNode('foo', 'myrow');
            expect(_.size(Store.__private.grids['foo'].nodes)).toEqual(0);
            expect(Store.__private.getSavedNode('foo', 'myrow')).toBe(null);

        });

        it("should set the hovering timeout", function(done) {
            var grid = createSimpleGrid();

            spyOn(Store.__private, "stayHovering").and.callThrough();

            // reduce the delay
            var defaultHoveringDelay = Store.__private.hoveringDelay;
            Store.__private.hoveringDelay = 0.01;

            try {
                Store.__private.setHoveringTimeout('foo');
                expect(Store.__private.grids['foo'].hoveringTimeout).not.toBe(null);
            } finally {
                setTimeout(function() {
                    // check if the function were called
                    expect(Store.__private.stayHovering.calls.count()).toEqual(1);
                    // the function should have cleared the timeout
                    expect(Store.__private.grids['foo'].hoveringTimeout).toBe(null);
                    done();
                }, 0.02)
                // restore the original delay
                Store.__private.hoveringDelay = defaultHoveringDelay;
            }

        });

        it("should clear the hovering timeout", function(done) {
            var grid = createSimpleGrid();

            spyOn(Store.__private, "stayHovering").and.callThrough();

            // reduce the delay
            var defaultHoveringDelay = Store.__private.hoveringDelay;
            Store.__private.hoveringDelay = 0.01;

            try {
                // set the timeout
                Store.__private.setHoveringTimeout('foo');
                expect(Store.__private.grids['foo'].hoveringTimeout).not.toBe(null);
                // but clear it just after
                Store.__private.clearHoveringTimeout('foo')
                // we should not have a timeout set anymore
                expect(Store.__private.grids['foo'].hoveringTimeout).toBe(null);
            } finally {
                setTimeout(function() {
                    // check if the function were NOT called
                    expect(Store.__private.stayHovering.calls.count()).toEqual(0);
                    // there should be no timeout set
                    expect(Store.__private.grids['foo'].hoveringTimeout).toBe(null);
                    done();
                }, 0.02)
                // restore the original delay
                Store.__private.hoveringDelay = defaultHoveringDelay;
            }


        });

    });

});