const fs = require("fs");
const db = require("../../../config/db");
const Auth = require("../auth.model");
const { createNestedDir } = require("../common");
const { isStringAndNotEmpty } = require("../../customTyping");

/**
 * @param {string} token The token given by the user.
 * @param {number} id The id of the user, whose photo will be updated.
 * @param {Buffer} buf The buffer of the photo
 * @param {string} format The given format of the photo.
 * @param {(status: number) => void} done Handles the completed API query.
 */
exports.putPhoto = async (token, id, buf, format, done) => {
  const userId = await Auth.authorize(token);
  if (userId !== null) {
    if (userId !== id) {
      const userExists = await Auth.userExists(id);
      if (userExists) {
        return done(403);
      } else {
        return done(404);
      }
    }

    const targetDir = `media/users/${id}/`;
    createNestedDir(targetDir);

    const filename = targetDir + `profile_photo.${format}`;
    fs.writeFileSync(filename, buf);
    db.getPool().query(
      "SELECT profile_photo_filename AS previousFilename FROM User WHERE " +
        "user_id = ?;" +
        "UPDATE User SET profile_photo_filename = ? WHERE " +
        "user_id = ?",
      [id, filename, id],
      (err, rows) => {
        if (err) {
          return done(400);
        }
        try {
          const { previousFilename } = rows[0][0];
          if (!isStringAndNotEmpty(previousFilename)) {
            return done(201);
          } else {
            return done(200);
          }
        } catch (error) {
          return done(400);
        }
      }
    );
  } else {
    return done(401);
  }
};

/**
 * @param {number} id The id of the user, whose photo will be updated.
 * @param {(status: number, filename?: string) => void} done Handles the
 * completed API query.
 */
exports.getPhoto = (id, done) => {
  db.getPool().query(
    "SELECT profile_photo_filename AS filename FROM User WHERE user_id = ?",
    [id],
    (err, rows) => {
      if (err || rows.length === 0) {
        return done(404);
      } else {
        const { filename } = rows[0];
        if (!isStringAndNotEmpty(filename)) {
          return done(404);
        }
        return done(200, filename);
      }
    }
  );
};

/**
 * @param {string} token The token to authenticate the user.
 * @param {number} id The id of the user whose photo will be deleted.
 * @param {(status: number) => void} done Handles the completed API query.
 */
exports.deletePhoto = async (token, id, done) => {
  const userId = await Auth.authorize(token);
  if (userId !== null) {
    if (userId !== id) {
      const userExists = await Auth.userExists(id);
      if (userExists) {
        return done(403);
      } else {
        return done(404);
      }
    }

    try {
      const rows = await db
        .getPool()
        .query(
          "SELECT profile_photo_filename AS filename FROM User WHERE " +
            "user_id = ?;" +
            "UPDATE User SET profile_photo_filename = null WHERE " +
            "user_id = ?",
          [id, id]
        );
      if (rows.length === 0 || rows[0].length === 0) {
        return done(400);
      }

      const { filename } = rows[0][0];
      if (!isStringAndNotEmpty(filename)) {
        return done(404);
      }

      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }
      return done(200);
    } catch (error) {
      return done(400);
    }
  } else {
    return done(401);
  }
};
