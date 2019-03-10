const { isString, isInteger, isFinite, isUndefined } = require("lodash/lang");

/**
 * Constructs an integer given the string input, if it is an integer.
 * @param {string} value
 * @param {{
 *   defaultValue?: number;
 *   minimum?: number;
 *   maximum?: number;
 *   canBeUndefined?: boolean;
 * }} options
 */
function constructInteger(
  value,
  { defaultValue, minimum, maximum, canBeUndefined }
) {
  const intValue = Number(value);
  if (isInteger(intValue)) {
    if (isInteger(minimum)) {
      if (minimum > intValue) {
        throw new Error("Value is too small.");
      }
    }
    if (isInteger(maximum)) {
      if (maximum < intValue) {
        throw new Error("Value is too large.");
      }
    }
    return intValue;
  } else if (defaultValue !== undefined && isInteger(defaultValue)) {
    return defaultValue;
  } else if (canBeUndefined === true) {
    return null;
  }
  throw new Error("string given is not an integer.");
}

/**
 * Constructs a boolean given the string input, if it is a boolean.
 * @param {string} value
 * @param {{
 *   defaultValue?: number;
 *   minimum?: number;
 *   maximum?: number;
 *   canBeUndefined?: boolean;
 * }} options
 */
function constructNumber(
  value,
  { defaultValue, minimum, maximum, canBeUndefined }
) {
  const newNumber = Number(value);
  if (isFinite(newNumber)) {
    if (isFinite(minimum)) {
      if (minimum > newNumber) {
        throw new Error("Value is too small.");
      }
    }
    if (isFinite(maximum)) {
      if (maximum < newNumber) {
        throw new Error("Value is too large.");
      }
    }
    return newNumber;
  } else if (defaultValue !== undefined && isFinite(defaultValue)) {
    return defaultValue;
  } else if (canBeUndefined === true) {
    return null;
  }
  throw new Error("string given is not a number");
}

/**
 * Constructs a boolean given the string input, if it is a boolean.
 * @param {string} value
 * @param {{defaultValue:? boolean; canBeUndefined?: boolean}} options
 */
function constructBoolean(value, { defaultValue, canBeUndefined }) {
  if (value === "false") {
    return false;
  } else if (value === "true") {
    return true;
  } else if (
    defaultValue !== undefined &&
    (defaultValue === true || defaultValue === false)
  ) {
    return defaultValue;
  } else if (canBeUndefined === true) {
    return null;
  }
  throw new Error("string given is not a boolean.");
}

/**
 * Constructs a string given the string input, if it is a boolean.
 * @param {string} value
 * @param {{
 *   defaultValue?: number;
 *   canBeEmpty?: boolean
 *   canBeUndefined?: boolean;
 *   legitValues?: Set<string>;
 * }} options
 */
function constructString(
  value,
  { defaultValue, canBeEmpty, canBeUndefined, legitValues }
) {
  if (isString(value)) {
    if (legitValues && !legitValues.has(value)) {
      throw new Error(
        "The given string was not in the set of legitimate values."
      );
    }
    if (canBeEmpty === false && isStringAndNotEmpty(value)) {
      return value;
    } else if (canBeEmpty === undefined || canBeEmpty === true) {
      return value;
    }
  }
  if (defaultValue !== undefined && isString(defaultValue)) {
    return defaultValue;
  } else if (canBeUndefined === true) {
    return null;
  }
  throw new Error("The given string was invalid");
}

/**
 * @param {{[key: string]: string}} inputs The inputs from which to construct the object.
 * @param {{
 * [key: string]: {
 *   valueType: "string" | "integer" | "number" | "boolean";
 *   defaultValue?: number | boolean | string;
 *   canBeEmpty?: boolean;
 *   minimum?: number;
 *   maximum?: number;
 *   canBeUndefined?: boolean;
 *   legitValues?: Set<string>
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
        minimum,
        maximum,
        canBeUndefined,
        legitValues
      } = schema[key];
      const value = inputs[key];
      let result;
      switch (valueType) {
        case "integer":
          result = constructInteger(value, {
            // @ts-ignore
            defaultValue,
            minimum,
            maximum,
            canBeUndefined
          });
          break;
        case "number":
          result = constructNumber(value, {
            // @ts-ignore
            defaultValue,
            minimum,
            maximum,
            canBeUndefined
          });
          break;
        case "boolean":
          // @ts-ignore
          result = constructBoolean(value, { defaultValue, canBeUndefined });
          break;
        case "string":
          result = constructString(value, {
            // @ts-ignore
            defaultValue,
            canBeEmpty,
            canBeUndefined,
            legitValues
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
