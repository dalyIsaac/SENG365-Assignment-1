const db = require("../../config/db");
const { isDefined } = require("../customTyping");
const auth = require("./auth.model");

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

  let orderBy = "ORDER BY ";
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
  if (params.reverseSort) {
    orderBy += "ASC ";
  } else {
    orderBy += "DESC ";
  }

  let limitQuery = isDefined(params.count)
    ? `SET @myLimit = ${params.count};`
    : `SELECT COUNT(venue_id) INTO @myLimit FROM Venue;`;
  const offset = `OFFSET ${params.startIndex} `;

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

/**
 * @params {number} id The id of the venue to retrieve.
 * @params {(status: number, result?: object) => void} done Handle the completed API request.
 */
exports.getVenue = (id, done) => {
  const select = [
    "venue_name AS venueName",
    "admin_id",
    "username",
    "Venue.category_id AS categoryId",
    "category_name AS categoryName",
    "category_description AS categoryDescription",
    "city",
    "short_description AS shortDescription",
    "long_description AS longDescription",
    "date_added AS dateAdded",
    "address",
    "latitude",
    "longitude"
  ];

  const query =
    "SELECT " +
    select.join(", ") +
    " FROM Venue " +
    "LEFT JOIN User ON Venue.admin_id = User.user_id " +
    "LEFT JOIN VenueCategory ON VenueCategory.category_id = Venue.category_id " +
    `WHERE user_id = ${id} `;

  db.getPool().query(query, (err, venues) => {
    if (err || venues.length === 0) {
      return done(404);
    }
    const photosSelect = [
      "photo_filename AS photoFilename",
      "photo_description AS photoDescription",
      "is_primary AS isPrimary"
    ];
    const photosQuery =
      "SELECT " + photosSelect.join(", ") + " FROM VenuePhoto";
    db.getPool().query(photosQuery, (err, photos) => {
      if (err) {
        return done(404);
      }
      const {
        venueName,
        admin_id,
        username,
        categoryId,
        categoryName,
        categoryDescription,
        city,
        shortDescription,
        longDescription,
        dateAdded,
        address,
        latitude,
        longitude
      } = venues[0];
      const output = {
        venueName,
        admin: {
          userId: admin_id,
          username
        },
        category: {
          categoryId,
          categoryName,
          categoryDescription
        },
        city,
        shortDescription,
        longDescription,
        dateAdded,
        address,
        latitude,
        longitude,
        photos: []
      };
      photos.forEach(props => {
        output.photos.push({ ...props });
      });
      return done(200, output);
    });
  });
};

/**
 * @param {{
 *   venueName: string;
 *   categoryId: number;
 *   city: string;
 *   shortDescription: string;
 *   longDescription: string;
 *   address: string;
 *   latitude: number;
 *   longitude: number;
 *   adminId?: number;
 * }} props The given properties to insert.
 * @param {(status: number, result?: { venueId: number }) => void} done Handles the completed API query.
 */
exports.create = async (token, props, done) => {
  const userId = await auth.authorize(token);
  if (userId !== null) {
    props.adminId = userId;
    const {
      venueName,
      categoryId,
      city,
      shortDescription,
      longDescription,
      address,
      latitude,
      longitude,
      adminId
    } = props;
    const query =
      `INSERT INTO Venue (` +
      `admin_id, venue_name, category_id, city, short_description, long_description, ` +
      `address, latitude, longitude, date_added` +
      `) VALUES (?);` +
      `SELECT LAST_INSERT_ID();`;
    const values = [
      [
        adminId,
        venueName,
        categoryId,
        city,
        shortDescription,
        longDescription,
        address,
        latitude,
        longitude,
        new Date()
      ]
    ];
    db.getPool().query(query, values, (err, rows) => {
      if (err) {
        return done(400);
      } else {
        return done(201, { venueId: rows[1][0]["LAST_INSERT_ID()"] });
      }
    });
  } else {
    return done(401);
  }
};
