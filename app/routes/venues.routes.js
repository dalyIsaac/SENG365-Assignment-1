const venues = require("../controllers/venues/venues.controller");
const photos = require("../controllers/venues/photos.controller");
const multer = require("multer");

const upload = multer({ dest: "media/tempVenues/" });

module.exports = app => {
  app.route("/api/v1/venues").get(venues.get);
  app.route("/api/v1/venues/:id").get(venues.getSingle);
  app.route("/api/v1/venues/").post(venues.create);
  app.route("/api/v1/venues/:id").patch(venues.patch);
  app.route("/api/v1/categories/").get(venues.getCategories);
  app
    .route("/api/v1/venues/:id/photos")
    .post(upload.fields([{ name: "photo", maxCount: 1 }]), photos.upload);
};
