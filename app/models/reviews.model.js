const db = require("../../config/db");
const Auth = require("./auth.model");
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
    const { adminId } = rows[0];
    if (adminId === userId) {
      return done(403);
    }
  } catch (error) {
    return done(403);
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
