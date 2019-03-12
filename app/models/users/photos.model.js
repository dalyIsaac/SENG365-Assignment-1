const fs = require("fs");
const Auth = require("../auth.model");

/**
 * @params {string} token The token given by the user.
 * @params {number} id The id of the user, whose photo will be updated.
 * @params {Buffer} buf The buffer of the photo
 * @params {string} format The given format of the photo.
 * @params {(status: number) => void} done Handles the completed API query.
 */
exports.getVenues = async (token, id, buf, format, done) => {
  const userId = await Auth.authorize(token);
  if (userId !== null) {
    if (userId !== id) {
      return 403;
    }

    fs.writeFileSync(`media/${id}/profile_photo.png`, buf);
    // TODO: update database
    // TODO: should return 201 when we upload a profile photo (JPEG) for a user who doesn't already have one
    // TODO: should return 200 when we upload a profile photo (PNG) for a user who already has one
  } else {
    return done(401);
  }
};
