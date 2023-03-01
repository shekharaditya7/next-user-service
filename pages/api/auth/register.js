import clientPromise from "../../../lib/mongodb";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret =
  "9c1fbba1a00fe74ba0578553c001c7c6f55ad731addd727c40e03a1fe4cc4d832aa527";

export default async function register(req, res) {
  const { email = "", password = "", name = "" } = req.body;
  if (!name || !password || !email) {
    return res.status(400).json({ message: "Invalid input." });
  }

  if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return res.status(400).json({ message: "Email is invalid." });
  }

  try {
    const client = await clientPromise;
    const db = client.db("user_db");
    const users = db.collection("users");
    const user = await users.findOne({ email });

    if (user) return res.status(401).json({ message: "Email already exists." });
    bcrypt.hash(password, 10).then(async (hash) => {
      try {
        const user = await users.insertOne({
          email,
          password: hash,
          name,
        });
        const maxAge = 3 * 60 * 60;
        const token = jwt.sign({ id: user._id, email }, jwtSecret, {
          expiresIn: maxAge, // 3hrs in sec
        });
        res.status(200).json({
          message: "User successfully created.",
          user: {
            email,
            name,
            token,
          },
        });
      } catch (e) {
        res.status(401).json({
          message: "User not successfully created.",
          error: err.mesage,
        });
      }
    });
  } catch (err) {
    res.status(401).json({
      message: "User not successful created",
      error: error.mesage,
    });
  }
}
