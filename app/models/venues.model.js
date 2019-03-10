const db = require("../../config/db");
const { isDefined } = require("../customTyping");

/**
 * @param {{
 *   startIndex: number;
 *   count?: number;
 *   city?: string;
 *   q?: string;
 *   categoryId?: number;
 *   minStarRating?: number;
 *   maxCostRating?: number;
 *   adminId?: number;
 *   sortBy: string;
 *   reverseSort: boolean;
 *   myLatitude?: number;
 *   myLongitude?: number;
 * }} params The given query parameters.
 * @param {(status: number, result?: Array<{
 *   venueId: number;
 *   venueName: string;
 *   categoryId: string;
 *   city: string;
 *   shortDescription: string;
 *   latitude: number;
 *   longitude: number;
 *   meanStarRating: number;
 *   modeCostRating: number;
 *   primaryPhoto: string;
 *   distance: number;
 * }>) => void} done Handles the completed API query.
 */
exports.getVenues = (params, done) => {
  // TODO: Should only include data if defined in the params
  const select = [
    "Venue.venue_id AS venueId",
    "venue_name AS venueName",
    "category_id AS categoryId",
    "city",
    "short_description AS shortDescription",
    "latitude",
    "longitude",
    "mode_cost_rating AS modeCostRating",
    "photo_filename AS photoFilename",
    "AVG(star_rating) AS meanStarRating"
  ];

  if (isDefined(params.myLatitude) && isDefined(params.myLongitude)) {
    select.push(`111.111 * DEGREES(ACOS(LEAST(COS(RADIANS(${params.myLatitude}))
         * COS(RADIANS(latitude))
         * COS(RADIANS(${params.myLongitude} - longitude))
         + SIN(RADIANS(${params.myLatitude}))
         * SIN(RADIANS(latitude)), 1.0))) AS distance`);
  }

  let conditions = "";
  if (isDefined(params.city)) {
    conditions += `AND city = '${params.city}' `;
  }
  if (isDefined(params.q)) {
    conditions += `AND venue_name LIKE '%${params.q}%' `;
  }
  if (isDefined(params.categoryId)) {
    conditions += `AND category_id = ${params.categoryId} `;
  }
  // meanStarRating is handled in the HAVING clause
  if (isDefined(params.maxCostRating)) {
    conditions += `AND mode_cost_rating <= ${params.maxCostRating} `;
  }
  if (isDefined(params.adminId)) {
    conditions += `AND admin_id = ${params.adminId} `;
  }
  if (conditions) {
    conditions = "WHERE 1 " + conditions;
  }

  const join =
    "LEFT JOIN Review ON Review.reviewed_venue_id = Venue.venue_id " +
    "LEFT JOIN VenuePhoto ON VenuePhoto.venue_id = Venue.venue_id " +
    "LEFT JOIN ModeCostRating ON Venue.venue_id = ModeCostRating.venue_id ";

  let having = "";
  if (isDefined(params.minStarRating)) {
    having += `meanStarRating >= ${params.minStarRating} `;
  }
  if (having !== "") {
    having = "HAVING " + having;
  }

  let groupBy = "";
  if (having === "") {
    groupBy = "GROUP BY Venue.venue_id ";
  }

  let orderBy = "";
  if (isDefined(params.sortBy)) {
    orderBy = "ORDER BY ";
    switch (params.sortBy) {
      case "STAR_RATING":
        orderBy += "meanStarRating ";
        break;
      case "COST_RATING":
        orderBy += "mode_cost_rating ";
        break;
      case "DISTANCE":
        orderBy += "distance ";
        break;
      default:
        break;
    }
  }
  if (orderBy !== "" && isDefined(params.reverseSort)) {
    orderBy += "DESC ";
  }

  const offset = `OFFSET ${params.startIndex} `;

  let limitQuery = isDefined(params.count)
    ? `SET @myLimit = ${params.count};`
    : `SELECT COUNT(venue_id) INTO @myLimit FROM Venue;`;
  const queryStr =
    "SELECT " +
    select.join(", ") +
    " FROM Venue " +
    join +
    conditions +
    " " +
    having +
    groupBy +
    orderBy +
    "LIMIT ? " +
    offset;
  const prepQuery = `PREPARE STMT FROM "${queryStr}";`;
  const execQuery = "EXECUTE STMT USING @myLimit;DEALLOCATE PREPARE STMT;";
  const query = limitQuery + prepQuery + execQuery;

  db.getPool().query(query, (err, rows) => {
    if (err) {
      return done(400);
    }
    return done(200, rows[2]);
  });
};
