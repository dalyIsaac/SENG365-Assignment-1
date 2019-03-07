const User = require("../models/users.model");
const jwt = require("jsonwebtoken");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = (req, res) => {
  const { username, email, givenName, familyName, password } = req.body;
  try {
    const user = {
      username: username.toString(),
      email: email.toString(),
      givenName: givenName.toString(),
      familyName: familyName.toString(),
      password: password.toString()
    };

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
      const { userId } = result;
      jwt.sign({ userId }, "secretkey", (err, token) => {
        res.status(status).send({ userId, token });
      });
    } else {
      res.send(status);
    }
  });
};
