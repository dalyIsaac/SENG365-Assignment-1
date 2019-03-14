const User = require("../../models/users/users.model");
const { constructObject } = require("../../customTyping");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = (req, res) => {
  try {
    const user = constructObject(req.body, {
      username: { valueType: "string", isRequired: true, canBeEmpty: false },
      email: {
        valueType: "string",
        isRequired: true,
        isEmail: true,
        canBeEmpty: false
      },
      givenName: { valueType: "string", isRequired: true, canBeEmpty: false },
      familyName: { valueType: "string", isRequired: true, canBeEmpty: false },
      password: { valueType: "string", isRequired: true, canBeEmpty: false }
    });

    // @ts-ignore
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
  try {
    let user;
    const { username, password, email } = constructObject(req.body, {
      username: { valueType: "string", isRequired: false, canBeEmpty: false },
      email: { valueType: "string", isRequired: false, canBeEmpty: false },
      password: { valueType: "string", isRequired: true, canBeEmpty: false }
    });

    if (username) {
      user = { attr: "username", attrValue: username, password };
    } else if (email) {
      user = { attr: "email", attrValue: email, password };
    } else {
      return res.send(400);
    }

    // @ts-ignore
    User.login(user, (status, result) => {
      if (result) {
        res.status(status).send(result);
      } else {
        res.send(status);
      }
    });
  } catch (error) {
    return res.send(400);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.logout = (req, res) => {
  try {
    // @ts-ignore
    const { "x-authorization": token } = constructObject(req.headers, {
      "x-authorization": {
        valueType: "string",
        isRequired: true,
        canBeEmpty: false
      }
    });
    // @ts-ignore
    User.logout(token, status => {
      res.send(status);
    });
  } catch (error) {
    return res.send(401);
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getUser = (req, res) => {
  let id;
  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    return res.send(404);
  }

  let token;
  try {
    // @ts-ignore
    ({ "x-authorization": token } = constructObject(req.headers, {
      "x-authorization": {
        valueType: "string",
        canBeEmpty: false,
        isRequired: false
      }
    }));
  } catch (error) {
    return res.send(401);
  }

  // @ts-ignore
  User.getUser(id, token || "", (status, result) => {
    res.status(status).send(result);
  });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.updateUser = (req, res) => {
  let id;
  try {
    ({ id } = constructObject(req.params, {
      id: { valueType: "integer", min: 0, isRequired: true }
    }));
  } catch (error) {
    return res.send(404);
  }

  let token;
  try {
    // @ts-ignore
    ({ "x-authorization": token } = constructObject(req.headers, {
      "x-authorization": {
        valueType: "string",
        isRequired: true,
        canBeEmpty: false
      }
    }));
  } catch (error) {
    return res.send(401);
  }

  let familyName, givenName, password;
  try {
    ({ familyName, givenName, password } = constructObject(req.body, {
      familyName: { valueType: "string", isRequired: false, canBeEmpty: false },
      givenName: { valueType: "string", isRequired: false, canBeEmpty: false },
      password: { valueType: "string", isRequired: false, canBeEmpty: false }
    }));
  } catch (error) {
    return res.send(400);
  }

  const props = [familyName, givenName, password].reduce((acc, curr) => {
    if (curr) {
      acc.push(curr);
    }
    return acc;
  }, []);

  if (props.length === 0) {
    res.send(400);
    return;
  }

  // @ts-ignore
  User.updateUser(id, props, token, status => {
    res.send(status);
  });
};
