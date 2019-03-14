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
      .query(
        "SELECT admin_id AS adminId FROM Venue " +
          `WHERE venue_id = ${venueId};`
      );
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
          `FROM VenuePhoto WHERE venue_id = ${venueId} AND is_primary = 1;`
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
            `UPDATE VenuePhoto SET is_primary = 0 WHERE venue_id = ${venueId}` +
              "AND is_primary = 1;"
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
