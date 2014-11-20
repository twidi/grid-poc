var Manipulator = require('./../../app/Grid/Manipulator.js');
var _ = require('lodash');

describe("Manipulator", function() {

  it("should convert Json to Xml and vice-versa", function() {
    var j = {
        _param1: 1,
        _param2: 2,
        child: {
            _childParam: 3,
            subChild: {
                _subChildParam: 4
            }
        },
        childs: [
            {
                _childs1Param: 5
            },
            {
                _childs2Param: 6
            },
            {
                _childs3Param: 7,
                subChild: {
                    _subChildParam: 8
                }
            }
        ]
    };

    var s = Manipulator.JSONGridToXMLString(j);
    expect(s).toEqual(
        '<grid param1="1" param2="2">' +
            '<child childParam="3">' +
                '<subChild subChildParam="4"/>' +
            '</child>' +
            '<childs childs1Param="5"/>' +
            '<childs childs2Param="6"/>' +
            '<childs childs3Param="7">' +
                '<subChild subChildParam="8"/>' +
            '</childs>' +
        '</grid>'
    );

    var x = Manipulator.JSONGridToXML(j);
    expect(x.childNodes.length).toEqual(1);

    var root = x.documentElement;

    expect(root.attributes.length).toEqual(2);
    expect(root.attributes[0].name).toEqual('param1');
    expect(root.attributes[0].value).toEqual('1');
    expect(root.attributes[1].name).toEqual('param2');
    expect(root.attributes[1].value).toEqual('2');

    expect(root.childNodes.length).toEqual(4);

    var child = root.childNodes[0];
    expect(child.tagName).toEqual('child');
    expect(child.attributes.length).toEqual(1);
    expect(child.attributes[0].name).toEqual('childParam');
    expect(child.attributes[0].value).toEqual('3');
    expect(child.childNodes.length).toEqual(1);

    var subChild = child.childNodes[0];
    expect(subChild.tagName).toEqual('subChild');
    expect(subChild.attributes.length).toEqual(1);
    expect(subChild.attributes[0].name).toEqual('subChildParam');
    expect(subChild.attributes[0].value).toEqual('4');
    expect(subChild.childNodes.length).toEqual(0);

    child = root.childNodes[1];
    expect(child.tagName).toEqual('childs');
    expect(child.attributes.length).toEqual(1);
    expect(child.attributes[0].name).toEqual('childs1Param');
    expect(child.attributes[0].value).toEqual('5');
    expect(child.childNodes.length).toEqual(0);

    child = root.childNodes[2];
    expect(child.tagName).toEqual('childs');
    expect(child.attributes.length).toEqual(1);
    expect(child.attributes[0].name).toEqual('childs2Param');
    expect(child.attributes[0].value).toEqual('6');
    expect(child.childNodes.length).toEqual(0);

    child = root.childNodes[3];
    expect(child.tagName).toEqual('childs');
    expect(child.attributes.length).toEqual(1);
    expect(child.attributes[0].name).toEqual('childs3Param');
    expect(child.attributes[0].value).toEqual('7');
    expect(child.childNodes.length).toEqual(1);

    subChild = child.childNodes[0];
    expect(subChild.tagName).toEqual('subChild');
    expect(subChild.attributes.length).toEqual(1);
    expect(subChild.attributes[0].name).toEqual('subChildParam');
    expect(subChild.attributes[0].value).toEqual('8');
    expect(subChild.childNodes.length).toEqual(0);

    var j2 = Manipulator.XMLGridToJSON(x);
    expect(j2).toEqual(j);

  });

  it("should create a new grid", function() {
    var grid = Manipulator.createBaseGrid('foo', 5);
    var expected = {
        _name: 'foo',
        _space: '5px',
        _type: 'mainGrid',
        content: {}
    };
    expect(grid).toEqual(expected);
  });

  it("should add a row", function() {
    var grid = Manipulator.createBaseGrid('foo', 5);

    // with an empty rows list
    Manipulator.addRow(grid);
    var expected = {
        _name: 'foo',
        _space: '5px',
        _type: 'mainGrid',
        content: {
            rows: [{}]
        }
    };
    expect(grid).toEqual(expected);

    // with a rows list with one row
    Manipulator.addRow(grid);
    var expected = {
        _name: 'foo',
        _space: '5px',
        _type: 'mainGrid',
        content: {
            rows: [{}, {}]
        }
    };
    expect(grid).toEqual(expected);

    // without the "rows" key, and check that row is returned by reference
    delete grid.content.rows;
    var row = Manipulator.addRow(grid);
    row._foo = 'bar'

    var expected = {
        _name: 'foo',
        _space: '5px',
        _type: 'mainGrid',
        content: {
            rows: [{_foo: 'bar'}]
        }
    };
    expect(grid).toEqual(expected);

    // transform a non-grid node
    delete row._foo;
    var cell = Manipulator.addCell(row, 'module');
    cell.content._foo = 'bar';

    var expected = {
        _name: 'foo',
        _space: '5px',
        _type: 'mainGrid',
        content: {
            rows: [
                {
                    cells: [
                        {
                            _type: 'module',
                            content: {_foo: 'bar'}
                        }
                    ]
                }
            ]
        }
    };
    expect(grid).toEqual(expected);

    var row = Manipulator.addRow(cell);
    row.bar = 'foo';

    var expected = {
        _name: 'foo',
        _space: '5px',
        _type: 'mainGrid',
        content: {
            rows: [
                {
                    cells: [
                        {
                            _type: 'grid',
                            content: {
                                rows:[
                                    {
                                        cells: [
                                            {
                                                _type: 'module',
                                                content: {_foo: 'bar'}
                                            },
                                        ]
                                    },
                                    {bar: 'foo'}
                                ]
                            }
                        }
                    ]
                }
            ]
        }
    };

    expect(grid).toEqual(expected);

  });

  it("should add a cell", function() {
    var grid = Manipulator.createBaseGrid('foo', 5);
    var row = Manipulator.addRow(grid);

    // without the "cells" key
    Manipulator.addCell(row, 'grid');
    var expected = {
        cells: [
            {_type: 'grid', content: {}}
        ]
    };
    expect(row).toEqual(expected);

    // with a cells list with one cell
    Manipulator.addCell(row, 'module');
    var expected = {
        cells: [
            {_type: 'grid', content: {}},
            {_type: 'module', content: {}}
        ]
    };
    expect(row).toEqual(expected);

    // without the "rows" key, and check that row is returned by reference
    delete row.cells;
    var cell = Manipulator.addCell(row, 'grid');
    cell.content._foo = 'bar';

    var expected = {
        cells: [
            {_type: 'grid', content: {_foo: 'bar'}}
        ]
    };
    expect(row).toEqual(expected);
  });

  it("should create a full grid", function() {
    var grid = Manipulator.createBaseGrid('foo', 5);
    var row1 = Manipulator.addRow(grid);
        var cell1 = Manipulator.addCell(row1, 'grid');
            var row2 = Manipulator.addRow(cell1);
                Manipulator.addCell(row2, 'module').content._path = 'path.to.module1';
                Manipulator.addCell(row2, 'module').content._path = 'path.to.module2';
            var row3 = Manipulator.addRow(cell1);
                Manipulator.addCell(row3, 'module').content._path = 'path.to.module3';
                var cell2 = Manipulator.addCell(row3, 'grid');
                    var row4 = Manipulator.addRow(cell2);
                        Manipulator.addCell(row4, 'module').content._path = 'path.to.module4';
        var cell3 = Manipulator.addCell(row1, 'grid');

    var expected = {
        _name:"foo",
        _space:"5px",
        _type:"mainGrid",
        content: {
            rows:[
                {
                    cells:[
                        {
                            _type:"grid",
                            content:{
                                rows:[
                                    {
                                        cells: [
                                            {
                                                _type:"module",
                                                content: {_path: "path.to.module1"}
                                            },
                                            {
                                                _type:"module",
                                                content: {_path: "path.to.module2"}
                                            }
                                        ]
                                    },
                                    {
                                        cells:[
                                            {
                                                _type:"module",
                                                content: {_path: "path.to.module3"}
                                            },
                                            {
                                                _type:"grid",
                                                content:{
                                                    rows:[
                                                        {
                                                            cells:[
                                                                {
                                                                    _type:"module",
                                                                    content: {_path: "path.to.module4"}
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        },
                        {
                            _type:"grid",
                            content:{}
                        }
                    ]
                }
            ]
        }
    };

    expect(grid).toEqual(expected);
  });

    it("should clean a node with one row and one cell", function() {
        var grid = Manipulator.createBaseGrid('test');
        var row = Manipulator.addRow(grid);
        var cell = Manipulator.addCell(row, type='module');
        cell.content._foo = 'bar';

        // do not update the main grid
        Manipulator.cleanNode(grid);
        var expected = {
            _name: 'test',
            _space: '5px',
            _type: 'mainGrid',
            content: {
                rows: [
                    {
                        cells: [
                            {
                                _type: 'module',
                                content: { _foo: 'bar' }
                            }
                        ]
                    }
                ]
            }
        };

        expect(grid).toEqual(expected);

        // add a row (and convert to cell to have rows), and delete it
        row = Manipulator.addRow(cell);
        // remove the last row, we should have one
        cell.content.rows.pop()

        // check we have the correct cell
        var expectedCell = {
            _type: 'grid',
            content: {
                rows: [
                    {
                        cells: [
                            {
                                _type: 'module',
                                content: { _foo: 'bar' }
                            }
                        ]
                    }
                ]
            }
        };
        expect(cell).toEqual(expectedCell);

        // then clean
        Manipulator.cleanNode(cell);

        // we should be back to the original grid
        expect(cell).toEqual(expected.content.rows[0].cells[0]);
        expect(grid).toEqual(expected);

    });

});