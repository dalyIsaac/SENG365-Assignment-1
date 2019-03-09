const User = require("../models/users.model");
const emailValidator = require("email-validator");
const { isType } = require("./typeChecks");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = (req, res) => {
  const { username, email, givenName, familyName, password } = req.body;
  try {
    const user = {
      username,
      email,
      givenName,
      familyName,
      password
    };
    Object.keys(user).forEach(key => {
      if (!isType(user[key], "string")) {
        throw new Error("Expected a string");
      }
    });

    if (!emailValidator.validate(user.email)) {
      throw new Error("Invalid email address");
    }

    User.create(user, (status, result) => {
      if (result) {
        res.status(status).json(result);
      } else {
        res.send(status);
      }
      return;
    });
  } catch (error) {
    res.send(400);
    return;
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.login = (req, res) => {
  const { username, email, password } = req.body;
  let user = {};

  if (!password) {
    return res.send(400);
  }

  if (username) {
    user = { attr: "username", attrValue: username, password };
  } else if (email) {
    user = { attr: "email", attrValue: email, password };
  } else {
    return res.send(400);
  }

  User.login(user, (status, result) => {
    if (result) {
      res.status(status).send(result);
    } else {
      res.send(status);
    }
  });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.logout = (req, res) => {
  const { "x-authorization": token } = req.headers;

  if (token) {
    User.logout(token, status => {
      res.send(status);
    });
  } else {
    res.send(401);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getUser = (req, res) => {
  const { id } = req.params;
  const { "x-authorization": token } = req.headers;

  try {
    User.getUser(Number(id), token, (status, result) => {
      res.status(status).send(result);
    });
  } catch (error) {
    res.send(404);
  }
};
