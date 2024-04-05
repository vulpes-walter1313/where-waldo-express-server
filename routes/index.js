const express = require("express");
const indexController = require("../controllers/indexController");
const router = express.Router();

router.get("/gameimage", indexController.GET_GAMEIMAGE);

router.post("/verifyclick", indexController.POST_VERIFYCLICK);

router.get("/scoreboard", indexController.GET_SCOREBOARD);

router.post("/scoreboard", indexController.POST_SCOREBOARD);

module.exports = router;
