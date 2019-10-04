'use strict';

require('@babel/polyfill');
require("@babel/register")({ extensions: ['.js', '.ts'] });

global.chai = require('chai');
global.chai.should();

global.expect = global.chai.expect;
