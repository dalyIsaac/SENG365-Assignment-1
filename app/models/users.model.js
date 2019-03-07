const db = require("../../config/db");
const passwords = require("./passwords.model");

/**
 * Registers a new user with the database.
 * @param {{
 *  username: string;
 *  email: string;
 *  givenName: string;
 *  familyName: string,
 *  password: string
 * }} newUser The new user to insert.
 * @param {(status: number, result?: { userId: string }) => void} done Handles completed API query
 */
exports.create = (newUser, done) => {
  const { username, email, givenName, familyName, password } = newUser;
  const values = [
    [username, email, givenName, familyName, passwords.hash(password)]
  ];
  db.getPool().query(
    `INSERT INTO User (username, email, given_name, family_name, password) VALUES (?)`,
    values,
    err => {
      if (err) {
        return done(400);
      }
      db.getPool().query(
        "SELECT user_id FROM User WHERE username = ?",
        username,
        (err, rows) => {
          if (err) {
            return done(400);
          }
          const userId = rows[0]["user_id"];
          done(201, { userId });
        }
      );
    }
  );
};

/**
 * Attempts to login a user aginst the database.
 * @param {{
 *  attr: "username" | "email",
 *  attrValue: string,
 *  password: string
 * }} user The user to authenticate.
 * @param {(status: number, result?: { userId: string }) => void} done Handles completed API query
 */
exports.login = (user, done) => {
  const { attr, attrValue, password } = user;
  db.getPool().query(
    `SELECT user_id, password FROM User WHERE ${attr} = "${attrValue}"`,
    [],
    (err, rows) => {
      if (err || rows.length === 0) {
        return done(400);
      }
      const hash = rows[0]["password"];
      const userId = rows[0]["user_id"];
      const authResult = passwords.test(password, hash);
      if (authResult) {
        return done(200, { userId });
      } else {
        return done(400);
      }
    }
  );
};
