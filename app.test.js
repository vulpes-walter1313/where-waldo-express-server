require("dotenv").config();
const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const indexRouter = require("./routes/index");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

async function startMongoose() {
  await mongoose.connect(process.env.MONGODB_URI);
}
startMongoose().catch((err) => console.log(err));

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
  }),
);
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

describe("/gameimage", () => {
  test("/gameimage returns valid url", async () => {
    const response = await request(app).get("/gameimage?imageCode=1");
    expect(response.body.imageUrl).toMatch(/https/);
  });
});

describe("testing clicks", () => {
  test("successful clicks is working", async () => {
    const agent = request.agent(app);
    await agent.get("/gameimage?imageCode=1");

    const response = await agent.post("/verifyclick").send({
      character: "waldo",
      xCoord: 648,
      yCoord: 711,
      widthpx: 1500,
      heightpx: 926,
    });

    expect(response.body).toEqual({
      success: true,
      clickIsCorrect: true,
      wonGame: false,
    });
    const secondRes = await agent.post("/verifyclick").send({
      character: "wizard",
      xCoord: 986,
      yCoord: 720,
      widthpx: 1500,
      heightpx: 926,
    });

    expect(secondRes.body.success).toBe(true);
    expect(secondRes.body.clickIsCorrect).toBe(true);
    expect(secondRes.body.wonGame).toBe(true);
    expect(secondRes.body).toHaveProperty("isTopScore");
    expect(secondRes.body).toHaveProperty("score");
  });

  test("testing successful clicks with different img size", async () => {
    const agent = request.agent(app);
    await agent.get("/gameimage?imageCode=1");

    const response = await agent.post("/verifyclick").send({
      character: "waldo",
      xCoord: 864,
      yCoord: 948,
      widthpx: 2000,
      heightpx: 1235,
    });

    expect(response.body).toEqual({
      success: true,
      clickIsCorrect: true,
      wonGame: false,
    });
    const secondRes = await agent.post("/verifyclick").send({
      character: "wizard",
      xCoord: 1315,
      yCoord: 960,
      widthpx: 2000,
      heightpx: 1235,
    });

    expect(secondRes.body.success).toBe(true);
    expect(secondRes.body.clickIsCorrect).toBe(true);
    expect(secondRes.body.wonGame).toBe(true);
    expect(secondRes.body).toHaveProperty("isTopScore");
    expect(secondRes.body).toHaveProperty("score");
  });

  test("unsuccessful clicks is working normally", async () => {
    const agent = request.agent(app);
    await agent.get("/gameimage?imageCode=1");

    const response = await agent.post("/verifyclick").send({
      character: "waldo",
      xCoord: 111,
      yCoord: 111,
      widthpx: 1500,
      heightpx: 926,
    });

    expect(response.body).toEqual({
      success: true,
      clickIsCorrect: false,
      wonGame: false,
    });
    const secondRes = await agent.post("/verifyclick").send({
      character: "wizard",
      xCoord: 123,
      yCoord: 123,
      widthpx: 1500,
      heightpx: 926,
    });

    expect(secondRes.body).toEqual({
      success: true,
      clickIsCorrect: false,
      wonGame: false,
    });
  });
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
  } catch (err) {
    console.log("some error occurred", err);
    throw err;
  }
});
