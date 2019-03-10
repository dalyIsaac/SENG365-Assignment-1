const venues = require("../controllers/venues.controller");

module.exports = app => {
  app.route("/api/v1/venues").get(venues.get);
};
