const { constructObject } = require("../../customTyping");
const Photos = require("../../models/users/photos.model");
const fs = require("fs");
const path = require("path");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.upload = (req, res) => {
  let token;
  let id;
  try {
    // @ts-ignore
    ({
      "x-authorization": token
      // @ts-ignore
    } = constructObject(req.headers, {
      "x-authorization": {
        valueType: "string",
        isRequired: true,
        canBeEmpty: false
      }
    }));
  } catch (error) {
    return res.sendStatus(401);
  }

  let contentType;
  try {
    // @ts-ignore
    ({
      "content-type": contentType
      // @ts-ignore
    } = constructObject(req.headers, {
      "content-type": {
        valueType: "string",
        isRequired: true,
        canBeEmpty: false
      }
    }));
  } catch (error) {
    return res.sendStatus(400);
  }

  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    return res.send(404);
  }

  if (Buffer.isBuffer(req.body)) {
    let format;
    if (contentType === "image/png") {
      format = "png";
    } else if (contentType === "image/jpeg") {
      format = "jpg";
    } else {
      return res.send(400);
    }
    // @ts-ignore
    Photos.putPhoto(token, id, req.body, format, status => {
      return res.sendStatus(status);
    });
  } else {
    return res.sendStatus(400);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getPhoto = (req, res) => {
  let id;
  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    return res.send(404);
  }

  Photos.getPhoto(id, (status, filename) => {
    if (filename) {
      if (fs.existsSync(filename)) {
        const absolutePath =
          path.resolve(__dirname, "../../../") + "/" + filename;
        return res.sendFile(absolutePath);
      }
    }
    return res.sendStatus(status);
  });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.deletePhoto = (req, res) => {
  let token;
  let id;
  try {
    // @ts-ignore
    ({ "x-authorization": token } = constructObject(req.headers, {
      "x-authorization": {
        valueType: "string",
        isRequired: true,
        canBeEmpty: false
      }
    }));
  } catch (error) {
    return res.sendStatus(401);
  }

  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    return res.send(404);
  }

  // @ts-ignore
  Photos.deletePhoto(token, id, status => {
    return res.send(status);
  });
};
