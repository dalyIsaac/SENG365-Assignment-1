const venues = require("../controllers/venues.controller");

module.exports = app => {
  app.route("/api/v1/venues").get(venues.get);
  app.route("/api/v1/venues/:id").get(venues.getSingle);
  app.route("/api/v1/venues/").post(venues.create);
  app.route("/api/v1/venues/:id").patch(venues.patch);
};
