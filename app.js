require("dotenv").config();
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const indexRouter = require("./routes/index");
const MongoStore = require("connect-mongo");
const morgan = require("morgan");

const app = express();

// starts mongoose
async function startMongoose() {
  await mongoose.connect(process.env.MONGODB_URI);
}
startMongoose().catch((err) => console.log(err));

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
      sameSite: "lax",
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
  }),
);
app.use(morgan("dev"));
app.use("/", indexRouter);
app.all("*", (req, res, next) => {
  const error = new Error("This resource does not exist");
  error.status = 404;
  next(error);
});
app.use((err, req, res, next) => {
  console.error(err);
  err.message = err.message ?? "Unexpected Error occured";
  res.status(err.status ?? 500).json({
    success: false,
    error: {
      message: err.toString(),
      status: err.status ?? 500,
    },
  });
});

const server = app.listen(process.env.PORT, () => {
  console.log(`[server]: running on port ${process.env.PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
