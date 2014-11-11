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
    expect(_.isEqual(j2, j)).toEqual(true);

  });

});