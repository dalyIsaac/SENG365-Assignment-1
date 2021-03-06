const db = require("../../config/db");
const Auth = require("./auth.model");
const { isInteger } = require("lodash/lang");

/**
 * @param {number} id
 * @param {string} token
 * @param {{
 *   reviewBody?: string;
 *   starRating?: number;
 *   costRating?: number;
 * }} props
 * @param {(status: number, result?: {}) => void} done
 */
exports.create = async (
  id,
  token,
  { reviewBody, starRating, costRating },
  done
) => {
  const userId = await Auth.authorize(token);
  if (userId === null) {
    return done(401);
  }

  try {
    const rows = await db
      .getPool()
      .query("SELECT admin_id AS adminId FROM Venue WHERE venue_id = ?;", [
        [id]
      ]);
    if (rows.length && rows.length > 0) {
      const { adminId } = rows[0];
      if (adminId === userId) {
        return done(403);
      }
    } else {
      return done(404); // venue_id doesn't exist inside the database
    }
  } catch (error) {
    return done(404);
  }

  try {
    const rows = await db
      .getPool()
      .query(
        "SELECT * FROM Review WHERE review_author_id = ? AND " +
          "reviewed_venue_id = ?",
        [[userId], [id]]
      );
    if (rows.length > 0) {
      throw new Error("User has already reviewed this venue");
    }
  } catch (error) {
    return done(403);
  }

  try {
    await db
      .getPool()
      .query(
        "INSERT INTO Review " +
          "(reviewed_venue_id, review_author_id, review_body, star_rating, " +
          "cost_rating, time_posted) VALUES (?)",
        [[id, userId, reviewBody, starRating, costRating, new Date()]]
      );
    return done(201);
  } catch (error) {
    return done(400);
  }
};

/**
 * @param {number} id
 * @param {(status: number, result?: {}) => void} done
 */
exports.getByVenues = async (id, done) => {
  try {
    const rows = await db.getPool().query(
      "SELECT COUNT(venue_id) AS idCount FROM Venue WHERE venue_id = ?;" +
        `SELECT user_id AS userId, username, review_body AS reviewBody,
      star_rating AS starRating, cost_rating AS costRating, 
      time_posted AS timePosted, venue_id AS venueId, venue_name AS venueName, 
      category_name AS categoryName, city, 
      short_description AS shortDescription, 
      (
        SELECT photo_filename AS photoFilename 
        FROM VenuePhoto 
        WHERE VenuePhoto.venue_id = Venue.venue_id AND is_primary =1 LIMIT 1
      ) AS primaryPhoto
      FROM Venue
      LEFT JOIN Review ON venue_id = reviewed_venue_id
      LEFT JOIN User ON review_author_id = user_id
      LEFT JOIN VenueCategory ON Venue.category_id = VenueCategory.category_id
      WHERE reviewed_venue_id = ?
      ORDER BY time_posted DESC;
      `,
      [id, id]
    );
    const { idCount } = rows[0][0];
    if (isInteger(idCount) && idCount > 0) {
      const output = rows[1].reduce((acc, curr) => {
        acc.push({
          reviewAuthor: {
            userId: curr.reviewAuthorId,
            username: curr.username
          },
          reviewBody: curr.reviewBody,
          starRating: curr.starRating,
          costRating: curr.costRating,
          timePosted: curr.timePosted,
          venue: {
            venueId: curr.venueId,
            venueName: curr.venuename,
            categoryName: curr.categoryName,
            city: curr.city,
            shortDescription: curr.shortDescription,
            primaryPhoto: curr.primaryPhoto
          }
        });
        return acc;
      }, []);
      return done(200, output);
    }
    return done(404);
  } catch (error) {
    return done(404);
  }
};

/**
 * @param {string} token
 * @param {number} id
 * @param {(status: number, result?: {}) => void} done
 */
exports.getByUser = async (token, id, done) => {
  const userId = await Auth.authorize(token);
  if (userId === null) {
    return done(401);
  }

  try {
    const rows = await db.getPool().query(
      `SELECT COUNT(user_id) AS idCount FROM User WHERE user_id = ?;
        SELECT user_id, username, review_body, star_rating, cost_rating, 
        time_posted, venue_id, venue_name, category_name, city, 
        short_description, (
          SELECT photo_filename AS photoFilename 
          FROM VenuePhoto 
          WHERE VenuePhoto.venue_id = Venue.venue_id AND is_primary =1 LIMIT 1
        ) AS primary_photo
        FROM User
        LEFT JOIN Review ON user_id = review_author_id
        LEFT JOIN Venue ON reviewed_venue_id = venue_id
        LEFT JOIN VenueCategory ON Venue.category_id = VenueCategory.category_id
        WHERE user_id = ?;`,
      [id, id]
    );
    const { idCount } = rows[0][0];
    if (isInteger(idCount) && idCount > 0) {
      const output = rows[1].reduce((acc, curr) => {
        acc.push({
          reviewAuthor: {
            userId: curr.user_id,
            username: curr.username
          },
          reviewBody: curr.review_body,
          starRating: curr.star_rating,
          costRating: curr.cost_rating,
          timePosted: curr.time_posted,
          venue: {
            venueId: curr.venue_id,
            venueName: curr.venue_name,
            categoryName: curr.category_name,
            city: curr.city,
            shortDescription: curr.short_description,
            primaryPhoto: curr.primary_photo
          }
        });
        return acc;
      }, []);
      return done(200, output);
    }
    return done(404);
  } catch (error) {
    return done(404);
  }
};
