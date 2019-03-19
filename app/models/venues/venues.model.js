const db = require("../../../config/db");
const { isDefined } = require("../../customTyping");
const Auth = require("../auth.model");
const { snakeCase } = require("change-case");

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
exports.getVenues = async (params, done) => {
  const select = [
    `Venue.venue_id AS venueId, venue_name AS venueName,
    category_id AS categoryId, city, short_description AS shortDescription,
    latitude, longitude, mode_cost_rating AS modeCostRating, (
      SELECT photo_filename 
      FROM VenuePhoto 
      WHERE Venue.venue_id = VenuePhoto.venue_id
    ) AS primaryPhoto,
    AVG(star_rating) AS meanStarRating`
  ];

  const values = [];

  if (isDefined(params.myLatitude) && isDefined(params.myLongitude)) {
    values.push(params.myLatitude, params.myLongitude, params.myLatitude);
    select.push(`111.111 * DEGREES(ACOS(LEAST(COS(RADIANS(?))
         * COS(RADIANS(latitude))
         * COS(RADIANS(? - longitude))
         + SIN(RADIANS(?))
         * SIN(RADIANS(latitude)), 1.0))) AS distance`);
  }

  let conditions = "";
  if (isDefined(params.city)) {
    values.push(params.city);
    conditions += "AND city = ? ";
  }
  if (isDefined(params.q)) {
    values.push(`%${params.q}%`);
    conditions += "AND venue_name LIKE ? ";
  }
  if (isDefined(params.categoryId)) {
    values.push(params.categoryId);
    conditions += "AND category_id = ? ";
  }
  // meanStarRating is handled in the HAVING clause
  if (isDefined(params.maxCostRating)) {
    values.push(params.maxCostRating);
    conditions += "AND mode_cost_rating <= ? ";
  }
  if (isDefined(params.adminId)) {
    values.push(params.adminId);
    conditions += "AND admin_id = ? ";
  }
  if (conditions) {
    conditions = "WHERE 1 " + conditions;
  }

  const join =
    "LEFT JOIN Review ON Review.reviewed_venue_id = Venue.venue_id " +
    "LEFT JOIN ModeCostRating ON Venue.venue_id = ModeCostRating.venue_id ";

  let having = "";
  if (isDefined(params.minStarRating)) {
    values.push(params.minStarRating);
    having += "meanStarRating >= ? ";
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

  let count;
  if (isDefined(params.count)) {
    count = params.count;
  } else {
    try {
      const rows = await db
        .getPool()
        .query("SELECT COUNT(venue_id) AS count FROM Venue");
      ({ count } = rows[0]);
    } catch (error) {
      return done(400);
    }
  }

  const queryStr =
    "SELECT " +
    select +
    " FROM Venue " +
    join +
    conditions +
    " " +
    having +
    groupBy +
    orderBy +
    "LIMIT ? OFFSET ?";
  values.push(count, params.startIndex);
  db.getPool().query(queryStr, values, (err, rows) => {
    if (err) {
      return done(400);
    }
    return done(200, rows);
  });
};

/**
 * @param {number} id The id of the venue to retrieve.
 * @param {(status: number, result?: object) => void} done Handle the completed API request.
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
    "WHERE user_id = ? ";

  db.getPool().query(query, [id], (err, venues) => {
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
    db.getPool().query(photosQuery, [id], (err, photos) => {
      if (err) {
        return done(404);
      }
      const venue = venues[0];
      const output = {
        venueName: venue.venueName,
        admin: {
          userId: venue.admin_id,
          username: venue.username
        },
        category: {
          categoryId: venue.categoryId,
          categoryName: venue.categoryName,
          categoryDescription: venue.categoryDescription
        },
        city: venue.city,
        shortDescription: venue.shortDescription,
        longDescription: venue.longDescription,
        dateAdded: venue.dateAdded,
        address: venue.address,
        latitude: venue.latitude,
        longitude: venue.longitude,
        photos: []
      };
      photos.forEach(props => {
        output.photos.push({
          ...props,
          isPrimary: props.isPrimary ? true : false
        });
      });
      return done(200, output);
    });
  });
};

/**
 * @param {string} token
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
  const userId = await Auth.authorize(token);
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
      "INSERT INTO Venue (" +
      "admin_id, venue_name, category_id, city, short_description, " +
      "long_description, address, latitude, longitude, date_added) VALUES (?);" +
      "SELECT LAST_INSERT_ID();";
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

/**
 * @param {string} token
 * @param {string} id
 * @param {{
 *   venueName?: string;
 *   categoryId?: number;
 *   city?: string;
 *   shortDescription?: string;
 *   longDescription?: string;
 *   address?: string;
 *   latitude?: number;
 *   longitude?: number;
 * }} props The given properties to insert.
 * @param {(status: number) => void} done Handles the completed API query.
 */
exports.patch = async (token, id, props, done) => {
  const userId = await Auth.authorize(token);
  if (userId !== null) {
    let adminId;
    try {
      const rows = await db
        .getPool()
        .query("SELECT admin_id AS adminId FROM Venue WHERE venue_id = ?", [
          id
        ]);
      ({ adminId } = rows[0]);
      if (adminId !== userId) {
        throw new Error("Invalid administrator.");
      }
    } catch (error) {
      return done(403);
    }

    try {
      const itemsStr = [];
      const items = [];
      Object.keys(props).forEach(key => {
        const val = props[key];
        if (isDefined(val) && props.hasOwnProperty(key)) {
          itemsStr.push("?? = ?");
          items.push(snakeCase(key), val);
        }
      });
      if (items.length === 0) {
        throw new Error("No changes were given");
      }

      await db
        .getPool()
        .query(
          "UPDATE Venue SET " + itemsStr.join(", ") + " WHERE venue_id = ?",
          [...items, id]
        );
      return done(200);
    } catch (error) {
      return done(400);
    }
  } else {
    return done(401);
  }
};

/**
 * @param {(status: number, results?: []) => void} done Handles the completed API query.
 */
exports.getCategories = done => {
  db.getPool().query(
    "SELECT category_id AS categoryId, " +
      "category_name as categoryName, category_description AS categoryDescription " +
      "FROM VenueCategory",
    (err, rows) => {
      if (err) {
        return done(400);
      } else {
        return done(200, rows);
      }
    }
  );
};
