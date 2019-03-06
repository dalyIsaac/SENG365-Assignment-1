const User = require("../models/users.model");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = (req, res) => {
  const { username, email, givenName, familyName, password } = req.body;
  const user = [
    username.toString(),
    email.toString(),
    givenName.toString(),
    familyName.toString(),
    password.toString()
  ];
  let values = [user];

  User.create(values, (status, description, result) => {
    res.status(status).send(description);
    if (result) {
      res.json(result);
    }
  });
};
