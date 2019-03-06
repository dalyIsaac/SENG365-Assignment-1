const User = require("../models/users.model");
const jwt = require("jsonwebtoken")

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
        jwt.sign(
          {
            username,
            password
          },
          "secretkey",
          (err, token) => {
            res.status(status).json({
              ...result,
              token
            })
          }
        );
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
