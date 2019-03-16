const Auth = require("../auth.model");
const db = require("../../../config/db");
const fs = require("fs");
const { isUndefined } = require("lodash/lang");
const { createNestedDir } = require("../common");

/**
 * @param {number} venueId
 * @param {string} photoFilename
 * @param {string} photoDescription
 * @param {boolean} isPrimary
 */
const addPhoto = (venueId, photoFilename, photoDescription, isPrimary) =>
  db
    .getPool()
    .query(
      "INSERT INTO VenuePhoto (venue_id, photo_filename, photo_description, " +
        "is_primary) VALUES (?)",
      [[venueId, photoFilename, photoDescription, isPrimary ? 1 : 0]]
    );

/**
 * @param {string} token
 * @param {number} venueId
 * @param {{
 *   path: string;
 *   filename: string;
 *   destination: string;
 *   mimetype: string;
 * }} fileDescriptor
 * @param {string} description
 * @param {boolean} makePrimary
 * @param {(status: number) => void} done
 */
exports.postPhoto = async (
  token,
  venueId,
  fileDescriptor,
  description,
  makePrimary,
  done
) => {
  const userId = await Auth.authorize(token);
  if (userId === null) {
    return done(401);
  }

  try {
    const adminRows = await db
      .getPool()
      .query("SELECT admin_id AS adminId FROM Venue " + "WHERE venue_id = ?;", [
        venueId
      ]);
    if (adminRows.length > 0) {
      const { adminId } = adminRows[0];
      if (isUndefined(adminId) || adminId !== userId) {
        // the admin is not the user
        return done(403);
      }
    }
  } catch (error) {
    return done(404);
  }

  /**
   * @type {Array<{venueId?: string; photoFilename?: string;}>}
   */
  let existingPrimaryRows;
  try {
    existingPrimaryRows = await db
      .getPool()
      .query(
        "SELECT venue_id AS venueId, photo_filename AS photoFilename, " +
          "photo_description AS photoDescription " +
          "FROM VenuePhoto WHERE venue_id = ? AND is_primary = 1;",
        [venueId]
      );
  } catch (error) {
    return done(404);
  }

  const targetDir = `media/venues/${venueId}/`;
  let newName = fileDescriptor.filename;
  if (fileDescriptor.mimetype === "image/jpeg") {
    newName += ".jpg";
  } else if (fileDescriptor.mimetype === "image/png") {
    newName += ".png";
  } else {
    return done(400);
  }

  const newPath = targetDir + newName;
  try {
    if (existingPrimaryRows.length === 0) {
      // Venue doesn't have any photos, so this one should become the primary
      await addPhoto(venueId, newName, description, true);
    } else {
      if (makePrimary) {
        // Updates the old primary photo so that it isn't primary anymore
        await db
          .getPool()
          .query(
            "UPDATE VenuePhoto SET is_primary = 0 WHERE " +
              "venue_id = ? AND is_primary = 1;",
            [venueId]
          );
        await addPhoto(venueId, newName, description, true);
      } else {
        await addPhoto(venueId, newName, description, false);
      }
    }
  } catch (error) {
    return done(400);
  }

  createNestedDir(targetDir);

  // Move the photo, and rename it
  fs.renameSync(fileDescriptor.path, newPath);
  return done(201);
};

/**
 * @param {string} token
 * @param {number} id
 * @param {string} photoFilename
 * @param {(status: number) => void} done
 */
exports.delete = async (token, id, photoFilename, done) => {
  const userId = await Auth.authorize(token);
  if (userId !== null) {
    try {
      // Gets the admin_id of the venue
      const rows = await db
        .getPool()
        .query("SELECT admin_id as adminId FROM Venue WHERE venue_id = ?;", [
          id
        ]);
      const { adminId } = rows[0];
      if (adminId !== userId) {
        return done(403);
      }
    } catch (error) {
      return done(403);
    }

    const path = `media/venues/${id}/${photoFilename}`;
    // Unlinks the photo, if it exists
    try {
      fs.unlinkSync(path);
    } catch (error) {
      return done(404);
    }

    let isPrimary;
    try {
      // Gets the photo from the DB to check if it was primary
      // Also removes the photo from the DB
      const rows = await db
        .getPool()
        .query(
          "SELECT is_primary as isPrimary FROM VenuePhoto WHERE " +
            "venue_id = ? AND photo_filename = ?;" +
            "DELETE FROM VenuePhoto WHERE venue_id = ? AND " +
            "photo_filename = ?;",
          [id, photoFilename, id, photoFilename]
        );
      ({ isPrimary } = rows[0][0]);
    } catch (error) {
      return done(404);
    }

    if (isPrimary) {
      try {
        // Makes a random photo the primary photo, if the deleted photo
        // was the primary
        await db
          .getPool()
          .query(
            "UPDATE VenuePhoto SET is_primary = 1 WHERE venue_id = ? LIMIT 1;",
            [id]
          );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      return done(200);
    }
  } else {
    return done(401);
  }
};

/**
 * @param {string} token
 * @param {number} id
 * @param {string} photoFilename
 * @param {(status: number) => void} done
 */
exports.setPrimary = async (token, id, photoFilename, done) => {
  const path = `media/venues/${id}/${photoFilename}`;
  if (!fs.existsSync(path)) {
    return done(404);
  }

  const userId = await Auth.authorize(token);
  if (userId === null) {
    return done(401);
  }

  // checks to see if the user is the admin for the venue
  try {
    const rows = await db
      .getPool()
      .query(
        "SELECT admin_id AS adminId FROM VenuePhoto LEFT JOIN Venue ON " +
          "Venue.venue_id = VenuePhoto.venue_id WHERE Venue.Venue_id = ? " +
          "AND photo_filename = ?;",
        [id, photoFilename]
      );
    const { adminId } = rows[0];
    if (adminId !== userId) {
      return done(403);
    }
  } catch (error) {
    return done(404);
  }

  // alters isPrimary
  try {
    await db
      .getPool()
      .query(
        "UPDATE VenuePhoto SET is_primary = IF(photo_filename = ?, 1, 0) " +
          "WHERE venue_id = ?",
        [photoFilename, id]
      );
    return done(200);
  } catch (error) {
    return done(404);
  }
};
