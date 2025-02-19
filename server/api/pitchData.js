const router = require("express").Router();
const {
  models: { PitchData },
} = require("../db");
module.exports = router;

// GET pitch datas
router.get("/", async (req, res, next) => {
  try {
    const pitchData = await PitchData.findAll();
    res.json(pitchData);
  } catch (err) {
    next(err);
  }
});

// GET pitch data
router.get("/:id", async (req, res, next) => {
  try {
    const pitchData = await PitchData.findByPk(req.params.id);
    res.json(pitchData);
  } catch (err) {
    next(err);
  }
});
