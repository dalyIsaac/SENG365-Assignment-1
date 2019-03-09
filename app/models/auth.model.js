const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../../config/db");

const saltRounds = 10;

/**
 * Returns a hash of the given password.
 * @params {string} password The password to hash.
 */
exports.hash = password => {
  return bcrypt.hashSync(password, saltRounds);
};

/**
 * Tests a password against the correct, hashed, password.'
 * @params {string} password The password to check.
 * @params {string} hash The hash of the stored password.
 */
exports.test = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

/**
 * Creates a token for a user.
 */
exports.createToken = () => crypto.randomBytes(32).toString("base64");

exports.authorize = async token => {
  try {
    const result = await db
      .getPool()
      .query(`SELECT user_id FROM User WHERE auth_token = "${token}"`);
    if (result.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
