const fs = require("fs");

/**
 * Creates directory.
 * @param {string} address
 */
exports.createNestedDir = address => {
  address.split("/").reduce((acc, curr) => {
    acc += curr + "/";
    if (!fs.existsSync(acc)) {
      fs.mkdirSync(acc);
    }
    return acc;
  }, "");
};
