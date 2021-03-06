const db = require("../../../config/db");
const Auth = require("../auth.model");

/**
 * Registers a new user with the database.
 * @param {{
 *  username: string;
 *  email: string;
 *  givenName: string;
 *  familyName: string,
 *  password: string
 * }} newUser The new user to insert.
 * @param {(status: number,
 * result?: { userId: string }) => void} done Handles completed API query.
 */
exports.create = (newUser, done) => {
  const { username, email, givenName, familyName, password } = newUser;
  const values = [
    [username, email, givenName, familyName, Auth.hash(password)],
    username
  ];
  db.getPool().query(
    "INSERT INTO User (username, email, given_name, family_name, password) " +
      "VALUES (?);" +
      "SELECT user_id AS userId FROM User WHERE username = ?;",
    values,
    (err, rows) => {
      if (err) {
        return done(400);
      }
      try {
        const userId = rows[1][0].userId;
        done(201, { userId });
      } catch (error) {
        return done(400);
      }
    }
  );
};

/**
 * Saves a token in the database.
 * @param {string} userId The id of the user, to whom the token belongs.
 * @param {string} token The token to save.
 * @param {(status: number,
 *   result?: {
 *     userId: string;
 *     token: string }) => void} done
 * Handles completed API query
 */
function saveToken(userId, token, done) {
  db.getPool().query(
    "UPDATE User SET auth_token = ? WHERE user_id = ?",
    [token, userId],
    err => {
      if (err) {
        done(400);
      } else {
        done(200, { userId, token });
      }
    }
  );
}

/**
 * Attempts to login a user aginst the database.
 * @param {{
 *  attr: "username" | "email",
 *  attrValue: string,
 *  password: string
 * }} user The user to authenticate.
 * @param {(status: number,
 *   result?: { userId: string }) => void} done Handles completed API query
 */
exports.login = (user, done) => {
  const { attr, attrValue, password } = user;
  db.getPool().query(
    "SELECT user_id AS userId, password AS hash FROM User WHERE ?? = ?",
    [attr, attrValue],
    (err, rows) => {
      if (err || rows.length === 0) {
        return done(400);
      }
      const { hash, userId } = rows[0];
      const authResult = Auth.test(password, hash);
      if (authResult) {
        const token = Auth.createToken();
        return saveToken(userId, token, done);
      } else {
        return done(400);
      }
    }
  );
};

/**
 * Attempts to login a user aginst the database.
 * @param {string} token Identifies the user to remove.
 * @param {(status: number) => void} done Handles completed API query
 */
exports.logout = async (token, done) => {
  const authorized = await Auth.authorize(token);
  if (authorized !== null) {
    db.getPool().query(
      "UPDATE User SET auth_token = null WHERE auth_token = ?",
      [token],
      () => {
        done(200);
      }
    );
  } else {
    done(401);
  }
};

/**
 * Retrieves theinformation about a user.
 * @param {number} id The `id` of the user.
 * @param {string} token Identifies the user to remove.
 * @param {(status: number, result?:
 *  {
 *   username: string;
 *   email?: string;
 *   givenName: string;
 *   familyName: string;
 *  }) => void
 * } done Handles completed API query
 */
exports.getUser = async (id, token, done) => {
  let userId;
  // this case uniquely allows the retrieval of data when not authenticated.
  if (token === "") {
    userId = null;
  } else {
    userId = await Auth.authorize(token);
  }
  if (userId === id) {
    db.getPool().query(
      "SELECT username, email, given_name AS givenName, " +
        "family_name as familyName FROM User WHERE user_id = ?",
      [id],
      (err, rows) => {
        if (err) {
          return done(404);
        }
        return done(200, rows[0]);
      }
    );
  } else {
    db.getPool().query(
      "SELECT username, given_name as givenName, family_name as familyName " +
        "FROM User WHERE user_id = ?",
      [id],
      (err, rows) => {
        if (err || rows.length === 0) {
          return done(404);
        }
        return done(200, rows[0]);
      }
    );
  }
};

/**
 *
 * @param {number} id The id of the user.
 * @param {{
 *   familyName?: string;
 *   givenName?: string;
 *   password?: string;
 * }} newProps The new properties for the user.
 * @param {string} token The token to authenticate with.
 * @param {(status: number) => void} done Handles completed API query.
 */
exports.updateUser = async (id, newProps, token, done) => {
  const userId = await Auth.authorize(token);
  if (userId !== null) {
    if (userId !== id) {
      // valid user data, authenticated as the wrong user
      return done(403);
    }

    const queryParts = ["UPDATE User SET"];
    const values = [];
    const { familyName, givenName, password } = newProps;
    if (familyName) {
      queryParts.push("family_name = ?,");
      values.push([familyName]);
    }
    if (givenName) {
      queryParts.push("given_name = ?,");
      values.push([givenName]);
    }
    if (password) {
      queryParts.push("password = ?,");
      values.push([password]);
    }
    queryParts.push("WHERE user_id = ?");
    values.push([userId]);

    db.getPool().query(queryParts.join(" "), () => {
      return done(200);
    });
  } else {
    // not authenticated
    return done(401);
  }
};
