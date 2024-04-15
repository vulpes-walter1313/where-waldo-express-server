const express = require("express");
const indexController = require("../controllers/indexController");
const router = express.Router();

router.get("/gameimage", indexController.GET_GAMEIMAGE);

router.post("/verifyclick", indexController.POST_VERIFYCLICK);

router.get("/scoreboard", indexController.GET_SCOREBOARD);

router.post("/scoreboard", indexController.POST_SCOREBOARD);

router.get("/gamestats", indexController.GET_GAMESTATS);

module.exports = router;
