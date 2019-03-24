const { constructObject } = require("../../customTyping");
const Venues = require("../../models/venues/venues.model");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.get = (req, res) => {
  try {
    const params = constructObject(req.query, {
      startIndex: { valueType: "integer", defaultValue: 0, min: 0 },
      count: { valueType: "integer", isRequired: false, min: 1 },
      city: { valueType: "string", isRequired: false },
      q: { valueType: "string", isRequired: false },
      categoryId: { valueType: "integer", isRequired: false, min: 0 },
      minStarRating: {
        valueType: "integer",
        isRequired: false,
        min: 1,
        max: 5
      },
      maxCostRating: {
        valueType: "integer",
        isRequired: false,
        min: 0,
        max: 4
      },
      adminId: { valueType: "integer", isRequired: false, min: 0 },
      sortBy: {
        valueType: "string",
        defaultValue: "STAR_RATING",
        legitValues: new Set(["STAR_RATING", "COST_RATING", "DISTANCE"])
      },
      reverseSort: { valueType: "boolean", defaultValue: false },
      myLatitude: {
        valueType: "number",
        isRequired: false,
        min: -180,
        max: 180
      },
      myLongitude: {
        valueType: "number",
        isRequired: false,
        min: -180,
        max: 180
      }
    });

    if (params.sortBy === "DISTANCE") {
      if (!(isFinite(params.myLatitude) && isFinite(params.myLongitude))) {
        throw new Error(
          "When sorting by DISTANCE, must provide both the " +
            "longitude and latitude."
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
  let id;
  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    return res.send(404);
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
  let token;
  try {
    // @ts-ignore
    ({ "x-authorization": token } = constructObject(req.headers, {
      "x-authorization": {
        valueType: "string",
        canBeEmpty: false,
        isRequired: true
      }
    }));
  } catch (error) {
    return res.send(401);
  }

  let props;
  try {
    props = constructObject(req.body, {
      venueName: {
        valueType: "string",
        canBeEmpty: false,
        isRequired: true
      },
      categoryId: { valueType: "integer", isRequired: true, min: 0 },
      city: { valueType: "string", canBeEmpty: false, isRequired: true },
      shortDescription: {
        valueType: "string",
        canBeEmpty: true,
        isRequired: true
      },
      longDescription: {
        valueType: "string",
        canBeEmpty: true,
        isRequired: true
      },
      address: { valueType: "string", canBeEmpty: false, isRequired: true },
      latitude: {
        valueType: "number",
        isRequired: true,
        min: -90,
        max: 90
      },
      longitude: {
        valueType: "number",
        canBeEmpty: false,
        isRequired: true,
        min: -180,
        max: 180
      }
    });
  } catch (error) {
    return res.send(400);
  }

  // @ts-ignore
  Venues.create(token, props, (status, result) => {
    if (result) {
      return res.status(status).send(result);
    } else {
      return res.sendStatus(status);
    }
  });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.patch = (req, res) => {
  let token;
  let id;
  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    return res.send(400);
  }

  try {
    ({ "x-authorization": token } = constructObject(req.headers, {
      "x-authorization": {
        valueType: "string",
        canBeEmpty: false,
        isRequired: true
      }
    }));
  } catch (error) {
    return res.send(401);
  }

  let props;
  try {
    props = constructObject(req.body, {
      venueName: {
        valueType: "string",
        canBeEmpty: false,
        isRequired: false
      },
      categoryId: { valueType: "integer", isRequired: false, min: 0 },
      city: { valueType: "string", canBeEmpty: false, isRequired: false },
      shortDescription: {
        valueType: "string",
        canBeEmpty: true,
        isRequired: false
      },
      longDescription: {
        valueType: "string",
        canBeEmpty: true,
        isRequired: false
      },
      address: { valueType: "string", canBeEmpty: false, isRequired: false },
      latitude: {
        valueType: "number",
        isRequired: false,
        min: -90,
        max: 90
      },
      longitude: {
        valueType: "number",
        canBeEmpty: false,
        isRequired: false,
        min: -180,
        max: 180
      }
    });
  } catch (error) {
    return res.send(400);
  }

  Venues.patch(token, id, props, status => {
    return res.sendStatus(status);
  });
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
