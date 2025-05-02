const express = require("express");
const { body, validationResult } = require("express-validator");
const Constituency = require("../models/constituency");
const Joi = require("joi");
const Candidate = require("../models/candidates");
const RedisManager = require("../RedisManager"); // Make sure RedisManager is imported
const { cachedKeys } = require("../utils");
const { isAdmin } = require("../middleware/admin");
const TempElection = require("../models/temp-election.model");
const ElectionConstituency = require("../models/constituency-election-model");

const router = express.Router();
const redis = RedisManager.getInstance();

const constituencySchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Name is required",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required",
  }),
  candidates: Joi.array().optional(),
});

// POST route to create a constituency and cache the data
router.post("/", isAdmin, async (req, res, next) => {
  const { error } = constituencySchema.validate(req.body);

  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect("/create-constituency");
  }

  try {
    const existingConstituency = await Constituency.findOne({
      name: req.body.name,
      state: req.body.state,
    });
    if (existingConstituency) {
      req.flash("error", "Constituency already exists!");
      return res.redirect("/create-constituency");
    }

    const constituency = new Constituency(req.body);
    await constituency.save();

    if (req.body.candidates) {
      for (let candidate of req.body.candidates) {
        await Candidate.findByIdAndUpdate(
          candidate,
          { constituency: constituency._id },
          { new: true }
        ).exec();
      }
    }

    await redis.clearAllKeys();

    return res.status(200).json(constituency);
  } catch (error) {
    console.log(error);
    req.flash("error", error.message);
    res.redirect("/create-constituency");
  }
});

// Get all constituencies and cache the result
// router.get("/", async (req, res, next) => {
//   try {
//     // Check if the constituency list is cached
//     const cachedData = await redis.get(cachedKeys.CONSTITUENCY);
//     if (cachedData) {
//       return res.json(cachedData);
//     }

//     // Fetch from DB if no cache
//     const constituencies = await Constituency.find()
//       .populate("candidates")
//       .sort({ name: 1 });

//     // Cache the result
//     await redis.setWithTTL(cachedKeys.CONSTITUENCY, constituencies, 3600);
//     res.json(constituencies);
//   } catch (error) {
//     next(error);
//   }
// });

// Get all constituencies relvent to the election
router.get("/", async (req, res, next) => {
  try {
    const { state, year, type } = req.query;

    if (!state || !year || !type) {
      return res.status(400).json({
        success: false,
        message: "State, year, and type are required query parameters",
      });
    }

    // First, find the election to get its ID
    const election = await TempElection.findOne({
      state: state,
      year: parseInt(year),
      electionType: type,
    }).lean();

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    const constituencies = await ElectionConstituency.find({
      election: election._id,
    })
      .populate({ path: "constituency", select: "-candidates" })
      .lean()
      .then((results) => results.map((result) => result.constituency));

    res.json(constituencies);
  } catch (error) {
    next(error);
  }
});

// Get a single constituency by ID
router.get("/:id", async (req, res, next) => {
  try {
    const constituency = await Constituency.findById(req.params.id).populate(
      "candidates"
    );
    if (!constituency) return res.status(404).send("Constituency not found");
    console.log(constituency);
    res.json(constituency);
  } catch (error) {
    next(error);
  }
});

// Update a constituency by ID and clear relevant cache
router.put("/:id", isAdmin, async (req, res, next) => {
  const { error } = constituencySchema.validate(req.body);

  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect(`/edit-constituency/${req.params.id}`);
  }

  try {
    const existingConstituency = await Constituency.findById(
      req.params.id
    ).populate("candidates");
    if (!existingConstituency)
      return res.status(404).send("Constituency not found");

    const newCandidateIds = req.body.candidates || [];
    // const removedCandidates = existingConstituency.candidates.filter(
    //     (candidate) => !newCandidateIds.includes(String(candidate._id))
    // );

    // const updatePromises = removedCandidates.map((candidate) =>
    //     Candidate.findByIdAndUpdate(candidate._id, { constituency: null })
    // );
    // await Promise.all(updatePromises);

    const updatedConstituency = await Constituency.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    await redis.clearAllKeys();
    res.json(updatedConstituency);
  } catch (error) {
    console.error(error, "updated");
    req.flash("error", error.message);
    res.redirect(`/edit-constituency/${req.params.id}`);
  }
});

// Delete a constituency by ID and clear relevant cache
router.delete("/:id", isAdmin, async (req, res, next) => {
  try {
    const constituency = await Constituency.findByIdAndDelete(req.params.id);
    if (!constituency) {
      return res.status(404).send("Constituency not found");
    }
    await redis.clearAllKeys();

    res.json({ message: "Constituency deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
    next(error);
  }
});

module.exports = router;
