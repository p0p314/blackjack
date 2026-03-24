import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Blackjack Game API!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
