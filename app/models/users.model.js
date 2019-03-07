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
  const values = [[username, email, givenName, familyName, passwords.hash(password)]];
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
