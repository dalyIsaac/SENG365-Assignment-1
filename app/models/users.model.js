const db = require("../../config/db");

/**
 * Registers a new user with the database.
 * @param {string[][]} newUser The new user to insert.
 * @param {(result: string) => void} done Handles completed API query
 */
exports.create = (newUser, done) => {
  db.getPool().query(
    "INSERT INTO User (username, email, givenName, familyName, password) VALUES ?",
    newUser,
    (err, rows) => {
      if (err) {
        return done(err);
      }
      done(rows);
    }
  );
};
