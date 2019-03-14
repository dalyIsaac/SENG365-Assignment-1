const { isString, isInteger, isFinite, isUndefined } = require("lodash/lang");
const emailValidator = require("email-validator");

/**
 * Constructs an integer given the string input, if it is an integer.
 * @param {string} value
 * @param {{
 *   key?: string;
 *   defaultValue?: number;
 *   min?: number;
 *   max?: number;
 *   isRequired?: boolean;
 * }} options
 */
function constructInteger(value, { defaultValue, min, max, isRequired, key }) {
  const intValue = parseInt(value);
  if (isInteger(intValue)) {
    if (isInteger(min)) {
      if (min > intValue) {
        throw new Error(`Key: ${key}: Value is too small.`);
      }
    }
    if (isInteger(max)) {
      if (max < intValue) {
        throw new Error(`Key: ${key}: Value is too large.`);
      }
    }
    return intValue;
  } else if (defaultValue !== undefined && isInteger(defaultValue)) {
    return defaultValue;
  } else if (isRequired === false) {
    return undefined;
  }
  throw new Error(`Key: ${key}: string given is not an integer.`);
}
exports.constructInteger = constructInteger;

/**
 * Constructs a boolean given the string input, if it is a boolean.
 * @param {string} value
 * @param {{
 *   key?: string;
 *   defaultValue?: number;
 *   min?: number;
 *   max?: number;
 *   isRequired?: boolean;
 * }} options
 */
function constructNumber(value, { key, defaultValue, min, max, isRequired }) {
  const newNumber = parseFloat(value);
  if (isFinite(newNumber)) {
    if (isFinite(min)) {
      if (min > newNumber) {
        throw new Error(`Key: ${key}: Value is too small.`);
      }
    }
    if (isFinite(max)) {
      if (max < newNumber) {
        throw new Error(`Key: ${key}: Value is too large.`);
      }
    }
    return newNumber;
  } else if (defaultValue !== undefined && isFinite(defaultValue)) {
    return defaultValue;
  } else if (isRequired === false) {
    return undefined;
  }
  throw new Error(`Key: ${key}: string given is not a number`);
}
exports.constructNumber = constructNumber;

/**
 * Constructs a boolean given the string input, if it is a boolean.
 * @param {string} value
 * @param {{key?: string; defaultValue:? boolean; isRequired?: boolean}} options
 */
function constructBoolean(value, { key, defaultValue, isRequired }) {
  if (value === "false") {
    return false;
  } else if (value === "true") {
    return true;
  } else if (
    defaultValue !== undefined &&
    (defaultValue === true || defaultValue === false)
  ) {
    return defaultValue;
  } else if (isRequired === false) {
    return undefined;
  }
  throw new Error(`Key: ${key}: string given is not a boolean.`);
}
exports.constructBoolean = constructBoolean;

/**
 * Constructs a string given the string input, if it is a boolean.
 * @param {string} value
 * @param {{
 *   key?: string;
 *   defaultValue?: number;
 *   canBeEmpty?: boolean
 *   isRequired?: boolean;
 *   legitValues?: Set<string>;
 *   isEmail?: boolean;
 * }} options
 */

function constructString(
  value,
  { key, defaultValue, canBeEmpty, isRequired, legitValues, isEmail }
) {
  if (isString(value)) {
    if (legitValues && !legitValues.has(value)) {
      throw new Error(
        `Key: ${key}: The given string was not in the set of legitimate values.`
      );
    }
    if (isEmail && !emailValidator.validate(value)) {
      throw new Error(`Key: ${key}: The given string was not an email.`);
    }
    if (canBeEmpty === false && isStringAndNotEmpty(value)) {
      return value;
    } else if (canBeEmpty === undefined || canBeEmpty === true) {
      return value;
    }
  }
  if (defaultValue !== undefined && isString(defaultValue)) {
    return defaultValue;
  } else if (isUndefined(value) && isRequired === false) {
    return undefined;
  }
  throw new Error(`Key: ${key}: The given string was invalid`);
}
exports.constructString = constructString;

/**
 * @param {{[key: string]: string}} inputs The inputs from which to construct
 * the object.
 * @param {{
 * [key: string]: {
 *   valueType: "string" | "integer" | "number" | "boolean";
 *   defaultValue?: number | boolean | string;
 *   canBeEmpty?: boolean;
 *   min?: number;
 *   max?: number;
 *   isRequired?: boolean;
 *   legitValues?: Set<string>
 *   isEmail?: boolean;
 * }}} schema Describes the desired schema
 */
exports.constructObject = (inputs, schema) => {
  const output = {};
  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      const {
        valueType,
        defaultValue,
        canBeEmpty,
        min,
        max,
        isRequired,
        legitValues,
        isEmail
      } = schema[key];
      const value = inputs[key];
      let result;
      switch (valueType) {
        case "integer":
          result = constructInteger(value, {
            key,
            // @ts-ignore
            defaultValue,
            min,
            max,
            isRequired
          });
          break;
        case "number":
          result = constructNumber(value, {
            key,
            // @ts-ignore
            defaultValue,
            min,
            max,
            isRequired
          });
          break;
        case "boolean":
          // @ts-ignore
          result = constructBoolean(value, { key, defaultValue, isRequired });
          break;
        case "string":
          result = constructString(value, {
            key,
            // @ts-ignore
            defaultValue,
            canBeEmpty,
            isRequired,
            legitValues,
            isEmail
          });
          break;
        default:
          break;
      }
      if (result !== null) {
        output[key] = result;
      }
    }
  }

  return output;
};

const isStringAndNotEmpty = value => isString(value) && value.length > 0;
exports.isStringAndNotEmpty = isStringAndNotEmpty;

exports.isDefined = value => !isUndefined(value);
