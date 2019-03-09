const { isString } = require("lodash/lang");

exports.isStringAndNotEmpty = value => isString(value) && value.length > 0;
