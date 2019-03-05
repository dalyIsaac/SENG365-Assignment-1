const User = require("../models/users.model");

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

  User.create(values, result => {
    res.json(result);
  });
};
