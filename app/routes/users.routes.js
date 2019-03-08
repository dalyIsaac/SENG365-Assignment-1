const users = require("../controllers/users.controller");

module.exports = app => {
  app.route("/api/v1/users").post(users.create);
  app.route("/api/v1/users/login").post(users.login);
};
