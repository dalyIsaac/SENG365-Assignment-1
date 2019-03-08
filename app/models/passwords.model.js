const bcrypt = require("bcrypt");

const saltRounds = 10;

exports.hash = password => {
  return bcrypt.hashSync(password, saltRounds);
};

exports.test = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};
