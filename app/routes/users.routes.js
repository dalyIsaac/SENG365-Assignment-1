const users = require("../controllers/users.controller");

module.exports = app => {
  app.route("/users").post(users.create);
};
