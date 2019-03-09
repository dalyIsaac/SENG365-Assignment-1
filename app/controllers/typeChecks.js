/**
 * Performs `typeof` operations on the value, for the given type.
 * @param {any} value The value to check the type.
 * @param {"string" | "number" | "object"} proposedType The name of the type.
 */
exports.isType = (value, proposedType) => {
  let typeResult = typeof value === proposedType;
  if (typeResult && proposedType === "string") {
    typeResult = typeResult && value.length > 0;
  }
  return typeResult;
};
