const { constructObject } = require("../customTyping");
const Reviews = require("../models/reviews.model");

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
        isRequired: true,
        canBeEmpty: false,
        valueType: "string"
      }
    }));
  } catch (error) {
    return res.send(401);
  }

  let id;
  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    return res.send(400);
  }

  let props;
  try {
    props = constructObject(req.body, {
      reviewBody: { valueType: "string", canBeEmpty: false, isRequired: true },
      starRating: { valueType: "integer", min: 1, max: 5, isRequired: true },
      costRating: { valueType: "integer", min: 0, max: 4, isRequired: true }
    });
  } catch (error) {
    return res.sendStatus(400);
  }

  Reviews.create(id, token, props, status => {
    return res.sendStatus(status);
  });
};
