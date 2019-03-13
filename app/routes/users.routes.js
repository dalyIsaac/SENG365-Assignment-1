const users = require("../controllers/users/users.controller");
const photos = require("../controllers/users/photos.controller");

module.exports = app => {
  app.route(app.rootUrl + "/users").post(users.create);
  app.route(app.rootUrl + "/users/login").post(users.login);
  app.route(app.rootUrl + "/users/logout").post(users.logout);
  app
    .route(app.rootUrl + "/users/:id")
    .get(users.getUser)
    .patch(users.updateUser);
  app
    .route(app.rootUrl + "/users/:id/photo")
    .put(photos.upload)
    .get(photos.getPhoto)
    .delete(photos.deletePhoto);
};
