const { isFinite } = require("lodash/lang");
const { constructObject, isDefined } = require("../customTyping");
const Venues = require("../models/venues.model");

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
