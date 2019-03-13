const { isDefined } = require("../../customTyping");
const { isUndefined } = require("lodash/lang");
const { constructObject } = require("../../customTyping");
const Photos = require("../../models/venues/photos.model");
const fs = require("fs");

function deleteTempPhoto(photo) {
  if (isDefined(photo)) {
    const newPhoto = photo[0];
    fs.unlinkSync(newPhoto.path);
  }
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.upload = (req, res) => {
  const { "x-authorization": token } = req.headers;
  const {
    "description\n": description,
    "makePrimary\n": makePrimary
  } = req.body;
  const { id } = req.params;
  // @ts-ignore
  const { photo } = req.files;

  if (isUndefined(token)) {
    deleteTempPhoto(photo);
    return res.send(401);
  } else if (
    isUndefined(description) ||
    isUndefined(makePrimary) ||
    isUndefined(id)
  ) {
    deleteTempPhoto(photo);
    return res.send(400);
  } else if (isUndefined(photo)) {
    deleteTempPhoto(photo);
    return res.send(400);
  }

  const newPhoto = photo[0];

  if (newPhoto.mimetype !== "image/jpeg" && newPhoto.mimetype !== "image/png") {
    deleteTempPhoto(photo);
    return res.status(400).send("Unsupported filetype");
  }

  Photos.postPhoto(
    // @ts-ignore
    token,
    Number(id),
    newPhoto,
    description,
    Boolean(makePrimary),
    status => {
      if (status >= 400) {
        deleteTempPhoto(photo);
      }
      return res.sendStatus(status);
    }
  );
};
