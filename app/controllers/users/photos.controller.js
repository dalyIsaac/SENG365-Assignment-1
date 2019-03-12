/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.upload = (req, res) => {
  const { "x-authorization": token, "content-type": contentType } = req.headers;
  const { id } = req.params;

  return res.send(404);
};
