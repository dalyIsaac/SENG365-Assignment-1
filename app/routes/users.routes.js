const users = require("../controllers/users/users.controller");
const photos = require("../controllers/users/photos.controller");

module.exports = app => {
  app.route("/api/v1/users").post(users.create);
  app.route("/api/v1/users/login").post(users.login);
  app.route("/api/v1/users/logout").post(users.logout);
  app.route("/api/v1/users/:id").get(users.getUser);
  app.route("/api/v1/users/:id").patch(users.updateUser);
  app.route("/api/v1/users/:id/photo").put(photos.upload);
  app.route("/api/v1/users/:id/photo").get(photos.getPhoto);
};
