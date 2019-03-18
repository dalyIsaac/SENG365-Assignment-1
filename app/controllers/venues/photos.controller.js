const Photos = require("../../models/venues/photos.model");
const fs = require("fs");
const path = require("path");
const { constructObject } = require("../../customTyping");

function deleteTempPhoto(newPhoto) {
  fs.unlinkSync(newPhoto.path);
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.upload = (req, res) => {
  let newPhoto;
  try {
    // @ts-ignore
    const { photo } = req.files;
    newPhoto = photo[0];
  } catch (error) {
    return res.send(400);
  }

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
    deleteTempPhoto(newPhoto);
    return res.send(401);
  }

  let description, makePrimary;
  try {
    ({ description, makePrimary } = constructObject(req.body, {
      makePrimary: {
        valueType: "boolean",
        isRequired: true
      },
      description: {
        valueType: "string",
        isRequired: true
      }
    }));
  } catch (error) {
    deleteTempPhoto(newPhoto);
    return res.send(400);
  }

  let id;
  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    deleteTempPhoto(newPhoto);
    return res.send(400);
  }

  if (newPhoto.mimetype !== "image/jpeg" && newPhoto.mimetype !== "image/png") {
    deleteTempPhoto(newPhoto);
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
        deleteTempPhoto(newPhoto);
      }
      return res.sendStatus(status);
    }
  );
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.get = (req, res) => {
  let id, photoFilename;
  try {
    ({ id, photoFilename } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true },
      photoFilename: {
        valueType: "string",
        isRequired: true,
        canBeEmpty: false
      }
    }));
  } catch (error) {
    return res.send(404);
  }

  const absolutePath =
    path.resolve(__dirname, "../../../") +
    `/media/venues/${id}/` +
    photoFilename;
  try {
    return res.status(200).sendfile(absolutePath);
  } catch (error) {
    return res.sendStatus(404);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.delete = (req, res) => {
  let id, photoFilename;
  try {
    ({ id, photoFilename } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true },
      photoFilename: {
        valueType: "string",
        isRequired: true,
        canBeEmpty: false
      }
    }));
  } catch (error) {
    return res.send(404);
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
    return res.send(401);
  }

  Photos.delete(token, id, photoFilename, status => {
    return res.sendStatus(status);
  });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.setPrimary = (req, res) => {
  let id, photoFilename;
  try {
    ({ id, photoFilename } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true },
      photoFilename: {
        valueType: "string",
        isRequired: true,
        canBeEmpty: false
      }
    }));
  } catch (error) {
    return res.send(404);
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
    return res.send(401);
  }

  Photos.setPrimary(token, id, photoFilename, status => {
    return res.sendStatus(status);
  });
};
