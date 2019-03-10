const User = require("../models/users.model");
const emailValidator = require("email-validator");
const { isStringAndNotEmpty } = require("../customTyping");
const { isInteger } = require("lodash/lang");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = (req, res) => {
  const { username, email, givenName, familyName, password } = req.body;
  try {
    const user = {
      username,
      email,
      givenName,
      familyName,
      password
    };
    Object.keys(user).forEach(key => {
      if (!isStringAndNotEmpty(user[key])) {
        throw new Error("Expected a string");
      }
    });

    if (!emailValidator.validate(user.email)) {
      throw new Error("Invalid email address");
    }

    User.create(user, (status, result) => {
      if (result) {
        res.status(status).json(result);
      } else {
        res.send(status);
      }
      return;
    });
  } catch (error) {
    res.send(400);
    return;
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.login = (req, res) => {
  const { username, email, password } = req.body;

  let user;

  if (!password) {
    return res.send(400);
  }

  if (username) {
    user = { attr: "username", attrValue: username, password };
  } else if (email) {
    user = { attr: "email", attrValue: email, password };
  } else {
    return res.send(400);
  }

  for (const key in user) {
    if (user.hasOwnProperty(key)) {
      const element = user[key];
      if (!isStringAndNotEmpty(element)) {
        return res.send(400);
      }
    }
  }

  // @ts-ignore
  User.login(user, (status, result) => {
    if (result) {
      res.status(status).send(result);
    } else {
      res.send(status);
    }
  });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.logout = (req, res) => {
  const { "x-authorization": token } = req.headers;

  if (token) {
    // @ts-ignore
    User.logout(token, status => {
      res.send(status);
    });
  } else {
    res.send(401);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getUser = (req, res) => {
  const { id } = req.params;
  const { "x-authorization": token } = req.headers;
  const userId = Number(id);

  if (!isInteger(userId)) {
    res.send(404);
    return;
  }

  try {
    // @ts-ignore
    User.getUser(userId, token || "", (status, result) => {
      res.status(status).send(result);
    });
  } catch (error) {
    res.send(404);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { "x-authorization": token } = req.headers;
  const userId = Number(id);

  if (!isInteger(userId)) {
    res.send(404);
    return;
  }
  if (!isStringAndNotEmpty(token)) {
    res.send(401);
    return;
  }

  const { familyName, givenName, password } = req.body;

  let props = {};
  try {
    if (familyName !== undefined) {
      if (isStringAndNotEmpty(familyName)) {
        props.familyName = familyName;
      } else {
        throw new Error("Incorrect type for family name");
      }
    }
    if (givenName !== undefined) {
      if (isStringAndNotEmpty(givenName)) {
        props.givenName = givenName;
      } else {
        throw new Error("Incorrect type for given name");
      }
    }
    if (password !== undefined) {
      if (isStringAndNotEmpty(password)) {
        props.password = password;
      } else {
        throw new Error("Incorrect type for password");
      }
    }
  } catch (error) {
    res.send(400);
    return;
  }

  if (Object.keys(props).length === 0) {
    res.send(400);
    return;
  }

  try {
    // @ts-ignore
    User.updateUser(userId, props, token, status => {
      res.send(status);
    });
  } catch (error) {}
};
