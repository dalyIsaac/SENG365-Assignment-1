const reviews = require("../controllers/reviews.controller");

module.exports = app => {
  app
    .route(app.rootUrl + "/venues/:id/reviews")
    .post(reviews.create)
    .get(reviews.get);
};
