import Cors from "cors";
import clientPromise from "../../../lib/mongodb";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('Invalid/Missing environment variable: "JWT_SECRET"');
}

const env = process.env.NODE_ENV;
const cors = Cors({
  methods: ["POST", "GET", "HEAD", "OPTIONS"],
  origin:
    env === "production"
      ? "https://this-is-me-74cbf.web.app"
      : "http://localhost:3000",
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function login(req, res) {
  try {
    await runMiddleware(req, res, cors);
    const { email = "", password = "" } = req.body;
    if (!password || !email) {
      return res.status(400).json({ message: "Invalid input." });
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ message: "Email is invalid." });
    }
    const client = await clientPromise;
    const db = client.db("user_db");
    const users = db.collection("users");
    const user = await users.findOne({ email });
    if (!user) {
      res.status(401).json({
        message: "User not found",
      });
    } else {
      bcrypt.compare(password, user.password).then(function (result) {
        if (result) {
          const maxAge = 3 * 60 * 60;
          const token = jwt.sign({ id: user._id, email }, jwtSecret, {
            expiresIn: maxAge, // 3hrs in sec
          });

          res.status(200).json({
            message: "",
            user: {
              email: user.email,
              name: user.name,
              token,
            },
          });
        } else
          res.status(401).json({
            message: "Password is incorrect.",
          });
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "An error occurred",
      error: error.message,
    });
  }
}
