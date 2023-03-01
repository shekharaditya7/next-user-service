import clientPromise from "../../../lib/mongodb";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret =
  "9c1fbba1a00fe74ba0578553c001c7c6f55ad731addd727c40e03a1fe4cc4d832aa527";

export default async function login(req, res) {
  try {
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
