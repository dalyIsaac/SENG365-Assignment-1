const db = require("../../config/db");

/**
 * Registers a new user with the database.
 * @param {string[][]} newUser The new user to insert.
 * @param {(status: number, description: string, result?: { userId: string }) => void} done Handles completed API query
 */
exports.create = (newUser, done) => {
  db.getPool().query(
    "INSERT INTO User (username, email, givenName, familyName, password) VALUES ?",
    newUser,
    (err, rows) => {
      if (err) {
        return done(400, "Bad Request");
      }
      const userId = rows[rows.length - 1]["user_id"];
      done(201, "Created", { userId });
    }
  );
};
