const db = require("../../config/db");

/**
 * Registers a new user with the database.
 * @param {string[][]} newUser The new user to insert.
 * @param {(status: number, result?: { userId: string }) => void} done Handles completed API query
 */
exports.create = (newUser, done) => {
  db.getPool().query(
    `INSERT INTO User (username, email, given_name, family_name, password) VALUES (?, SHA2(?, 512))`,
    newUser,
    err => {
      if (err) {
        return done(400);
      }
      db.getPool().query(
        "SELECT user_id FROM User WHERE username = ?",
        newUser[0],
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
