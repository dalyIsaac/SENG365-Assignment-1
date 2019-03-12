const { isDefined } = require("../../customTyping");
const { isUndefined } = require("lodash/lang");
const Photos = require("../../models/users/photos.model");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.upload = (req, res) => {
  const { "x-authorization": token, "content-type": contentType } = req.headers;
  const { id } = req.params;

  if (isUndefined(token)) {
    return res.sendStatus(401);
  }

  if (isDefined(contentType) && isDefined(id) && Buffer.isBuffer(req.body)) {
    let format;
    if (contentType === "image/png") {
      format = "png";
    } else if (contentType === "image/jpeg") {
      format = "jpg";
    } else {
      return res.send(400);
    }
    // @ts-ignore
    Photos.putPhoto(token, Number(id), req.body, format, status => {
      return res.sendStatus(status);
    });
  } else {
    return res.sendStatus(400);
  }
};
