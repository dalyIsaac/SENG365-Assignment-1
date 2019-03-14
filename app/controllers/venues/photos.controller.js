const Photos = require("../../models/venues/photos.model");
const fs = require("fs");
const { constructObject } = require("../../customTyping");

function deleteTempPhoto(photo) {
  const newPhoto = photo[0];
  fs.unlinkSync(newPhoto.path);
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.upload = (req, res) => {
  // @ts-ignore
  const { photo } = req.files;
  const newPhoto = photo[0];
  if (
    !(
      newPhoto.path &&
      newPhoto.filename &&
      newPhoto.destination &&
      newPhoto.mimetype
    )
  ) {
    return res.send(400);
  }

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
    deleteTempPhoto(photo);
    return res.send(401);
  }

  let description, makePrimary;
  try {
    ({
      "description\n": description,
      "makePrimary\n": makePrimary
    } = constructObject(req.body, {
      "makePrimary\n": {
        valueType: "boolean",
        isRequired: false,
        canBeEmpty: true
      },
      "description\n": {
        valueType: "string",
        isRequired: false,
        canBeEmpty: true
      }
    }));
  } catch (error) {
    deleteTempPhoto(photo);
    return res.send(400);
  }

  let id;
  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    deleteTempPhoto(photo);
    return res.send(400);
  }

  if (newPhoto.mimetype !== "image/jpeg" && newPhoto.mimetype !== "image/png") {
    deleteTempPhoto(photo);
    return res.status(400).send("Unsupported filetype");
  }

  Photos.postPhoto(
    // @ts-ignore
    token,
    id,
    newPhoto,
    description,
    makePrimary,
    status => {
      if (status >= 400) {
        deleteTempPhoto(photo);
      }
      return res.sendStatus(status);
    }
  );
};
