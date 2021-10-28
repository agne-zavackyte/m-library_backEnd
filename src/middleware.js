const jwt = require("jsonwebtoken");
require("dotenv").config();

function usernameLength(username) {
  return username.length < 6 || username.length > 64;
}

function passwordLength(password) {
  return password.length < 8 || password.length > 64;
}

module.exports = {
  validateUserData: (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    if (
      (!username || usernameLength(username)) &&
      (!password || passwordLength(password))
    ) {
      return res
        .status(400)
        .json({ msg: "Username and password does not follow the rules." });
    } else if (!username || usernameLength(username)) {
      return res
        .status(400)
        .json({ msg: "Username does not follow the rules." });
    } else if (!password || passwordLength(password)) {
      return res
        .status(400)
        .json({ msg: "Password does not follow the rules." });
    }
    next();
  },
  isLoggedIn: (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRETKEY);
      req.userData = decodedToken;
      next();
    } catch (err) {
      console.log(err);
      return res.status(401).send({ msg: "Your session is invalid" });
    }
  },
};
