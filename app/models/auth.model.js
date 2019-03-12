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
exports.createToken = () =>
  crypto
    .randomBytes(32)
    .toString("base64")
    .slice(0, 32);

/**
 * Attempts to verify that the given token resides within the database.
 * @param {string} token The token to verify.
 * @returns {Promise<number | null>} Returns the `user_id` of the user, if it exists.
 * Otherwise, it returns null.
 */
exports.authorize = async token => {
  try {
    const rows = await db
      .getPool()
      .query(`SELECT user_id FROM User WHERE auth_token = "${token}"`);
    if (rows.length > 0) {
      return Number(rows[0]["user_id"]);
    }
    return null;
  } catch (error) {
    return null;
  }
};
