const express = require("express");
const bodyParser = require("body-parser");

const allowCrossOriginRequests = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, X-Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
};

module.exports = function() {
  const app = express();
  app.rootUrl = "/api/v1";

  // MIDDLEWARE
  app.use(allowCrossOriginRequests);
  app.use(bodyParser.json());
  // for the /executeSql endpoint
  app.use(bodyParser.raw({ type: "text/plain" }));
  app.use(bodyParser.raw({ type: "image/png", limit: "20mb" }));
  app.use(bodyParser.raw({ type: "image/jpeg", limit: "20mb" }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // ROUTES
  require("../app/routes/backdoor.routes")(app);
  require("../app/routes/users.routes")(app);
  require("../app/routes/venues.routes")(app);
  require("../app/routes/reviews.routes")(app);

  // DEBUG (you can remove this)
  app.get("/", function(req, res) {
    res.send({ message: "Hello World!" });
  });

  return app;
};
