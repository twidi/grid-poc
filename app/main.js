
require('../styles/main.css')
import 'babel-polyfill';

var React = require('react');

var App = require('./App');

React.render(<App/>, document.getElementById('app'));
