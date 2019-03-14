const venues = require("../controllers/venues/venues.controller");
const photos = require("../controllers/venues/photos.controller");
const multer = require("multer");

const upload = multer({ dest: "media/tempVenues/" });

module.exports = app => {
  app
    .route(app.rootUrl + "/venues")
    .get(venues.get)
    .post(venues.create);

  app
    .route(app.rootUrl + "/venues/:id")
    .get(venues.getSingle)
    .patch(venues.patch);

  app.route(app.rootUrl + "/categories/").get(venues.getCategories);

  app
    .route(app.rootUrl + "/venues/:id/photos")
    .post(upload.fields([{ name: "photo", maxCount: 1 }]), photos.upload);

  app
    .route(app.rootUrl + "/venues/:id/photos/:photoFilename")
    .get(photos.get)
    .delete(photos.delete);

  app
    .route(app.rootUrl + "/venues/:id/photos/:photoFilename/setPrimary")
    .post(photos.setPrimary);
};
