const { isFinite, isUndefined } = require("lodash/lang");
const { constructObject } = require("../../customTyping");
const Venues = require("../../models/venues/venues.model");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.get = (req, res) => {
  const {
    startIndex,
    count,
    city,
    q,
    categoryId,
    minStarRating,
    maxCostRating,
    adminId,
    sortBy,
    reverseSort,
    myLatitude,
    myLongitude
  } = req.query;

  try {
    const inputs = {
      startIndex,
      count,
      city,
      q,
      categoryId,
      minStarRating,
      maxCostRating,
      adminId,
      sortBy,
      reverseSort,
      myLatitude,
      myLongitude
    };

    /**
     * @type {{
     * [key: string]: {
     *   valueType: "string" | "integer" | "number" | "boolean";
     *   defaultValue?: number | boolean | string;
     *   canBeEmpty?: boolean;
     *   minimum?: number;
     *   maximum?: number;
     *   canBeUndefined?: boolean;
     *   legitValues?: Set<string>;
     * }}}
     */
    const schema = {
      startIndex: { valueType: "integer", defaultValue: 0 },
      count: { valueType: "integer", canBeUndefined: true },
      city: { valueType: "string", canBeUndefined: true },
      q: { valueType: "string", canBeUndefined: true },
      categoryId: { valueType: "integer", canBeUndefined: true },
      minStarRating: {
        valueType: "integer",
        canBeUndefined: true,
        minimum: 1,
        maximum: 5
      },
      maxCostRating: {
        valueType: "integer",
        canBeUndefined: true,
        minimum: 0,
        maximum: 4
      },
      adminId: { valueType: "integer", canBeUndefined: true },
      sortBy: {
        valueType: "string",
        defaultValue: "STAR_RATING",
        legitValues: new Set(["STAR_RATING", "COST_RATING", "DISTANCE"])
      },
      reverseSort: { valueType: "boolean", defaultValue: false },
      myLatitude: {
        valueType: "number",
        canBeUndefined: true,
        minimum: -180,
        maximum: 180
      },
      myLongitude: {
        valueType: "number",
        canBeUndefined: true,
        minimum: -180,
        maximum: 180
      }
    };
    const params = constructObject(inputs, schema);

    if (params.sortBy === "DISTANCE") {
      if (!(isFinite(params.myLatitude) && isFinite(params.myLongitude))) {
        throw new Error(
          "When sorting by DISTANCE, must provide both the longitude and latitude."
        );
      }
    }
    if (isFinite(params.myLatitude) || isFinite(params.myLongitude)) {
      if (!(isFinite(params.myLatitude) && isFinite(params.myLongitude))) {
        throw new Error(
          "Latitude must be accompanied by longitude, and vice versa."
        );
      }
    }

    // @ts-ignore
    Venues.getVenues(params, (status, result) => {
      if (result) {
        res.status(status).json(result);
      } else {
        res.send(status);
      }
    });
  } catch (error) {
    return res.send(400);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getSingle = (req, res) => {
  const { id } = req.params;

  if (isUndefined(id)) {
    res.send(404);
  }

  Venues.getVenue(id, (status, result) => {
    if (result) {
      res.status(status).json(result);
    } else {
      res.sendStatus(status);
    }
  });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = (req, res) => {
  const { "x-authorization": token } = req.headers;
  if (isUndefined(token)) {
    return res.send(401);
  }

  /**
   * @type {{
   * [key: string]: {
   *   valueType: "string" | "integer" | "number" | "boolean";
   *   defaultValue?: number | boolean | string;
   *   canBeEmpty?: boolean;
   *   minimum?: number;
   *   maximum?: number;
   *   canBeUndefined?: boolean;
   *   legitValues?: Set<string>;
   * }}}
   */
  const schema = {
    venueName: {
      valueType: "string",
      canBeEmpty: false,
      canBeUndefined: false
    },
    categoryId: { valueType: "integer", canBeUndefined: false },
    city: { valueType: "string", canBeEmpty: false, canBeUndefined: false },
    shortDescription: {
      valueType: "string",
      canBeEmpty: true,
      canBeUndefined: false
    },
    longDescription: {
      valueType: "string",
      canBeEmpty: true,
      canBeUndefined: false
    },
    address: { valueType: "string", canBeEmpty: false, canBeUndefined: false },
    latitude: {
      valueType: "number",
      canBeUndefined: false,
      minimum: -90,
      maximum: 90
    },
    longitude: {
      valueType: "number",
      canBeEmpty: false,
      canBeUndefined: false,
      minimum: -180,
      maximum: 180
    }
  };
  try {
    const props = constructObject(req.body, schema);
    // @ts-ignore
    Venues.create(token, props, (status, result) => {
      if (result) {
        return res.status(status).send(result);
      } else {
        return res.sendStatus(status);
      }
    });
  } catch (error) {
    return res.send(400);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.patch = (req, res) => {
  const { "x-authorization": token } = req.headers;
  const { id } = req.params;
  if (isUndefined(token) || isUndefined(id)) {
    return res.send(401);
  }

  /**
   * @type {{
   * [key: string]: {
   *   valueType: "string" | "integer" | "number" | "boolean";
   *   defaultValue?: number | boolean | string;
   *   canBeEmpty?: boolean;
   *   minimum?: number;
   *   maximum?: number;
   *   canBeUndefined?: boolean;
   *   legitValues?: Set<string>;
   * }}}
   */
  const schema = {
    venueName: {
      valueType: "string",
      canBeEmpty: false,
      canBeUndefined: true
    },
    categoryId: { valueType: "integer", canBeUndefined: true },
    city: { valueType: "string", canBeEmpty: false, canBeUndefined: true },
    shortDescription: {
      valueType: "string",
      canBeEmpty: true,
      canBeUndefined: true
    },
    longDescription: {
      valueType: "string",
      canBeEmpty: true,
      canBeUndefined: true
    },
    address: { valueType: "string", canBeEmpty: false, canBeUndefined: true },
    latitude: {
      valueType: "number",
      canBeUndefined: true,
      minimum: -90,
      maximum: 90
    },
    longitude: {
      valueType: "number",
      canBeEmpty: false,
      canBeUndefined: true,
      minimum: -180,
      maximum: 180
    }
  };

  try {
    const props = constructObject(req.body, schema);
    // @ts-ignore
    Venues.patch(token, id, props, status => {
      return res.sendStatus(status);
    });
  } catch (error) {
    return res.send(400);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getCategories = (req, res) => {
  Venues.getCategories((status, result) => {
    if (result) {
      return res.status(200).send(result);
    } else {
      return res.sendStatus(status);
    }
  });
};
