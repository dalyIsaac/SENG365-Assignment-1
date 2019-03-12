const fs = require("fs");
const db = require("../../../config/db");
const Auth = require("../auth.model");
const { isUndefined, isNull } = require("lodash/lang");

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
      db.getPool().query(
        `SELECT * FROM User WHERE user_id = ${id}`,
        (err, rows) => {
          if (err || rows.length === 0) {
            return done(404);
          } else {
            return done(403);
          }
        }
      );
      return;
    }

    if (!fs.existsSync("media")) {
      fs.mkdirSync("media");
    }
    if (!fs.existsSync(`media/${id}`)) {
      fs.mkdirSync(`media/${id}`);
    }

    const filename = `media/${id}/profile_photo.${format}`;
    fs.writeFileSync(filename, buf);
    db.getPool().query(
      `SELECT profile_photo_filename AS previousFilename FROM User WHERE user_id = ${id};` +
        `UPDATE User SET profile_photo_filename = "${filename}" WHERE user_id = ${id}"`,
      (err, rows) => {
        if (err) {
          return done(400);
        }
        try {
          const { previousFilename } = rows[0][0];
          if (isUndefined(previousFilename) || isNull(previousFilename)) {
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
 * @param {(status: number, filename?: string) => void} done Handles the completed API query.
 */
exports.getPhoto = (id, done) => {
  db.getPool().query(
    `SELECT profile_photo_filename AS filename FROM User WHERE user_id = ${id}`,
    (err, rows) => {
      if (err || rows.length === 0) {
        return done(404);
      } else {
        const { filename } = rows[0];
        return done(200, filename);
      }
    }
  );
};
