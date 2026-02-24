const express = require("express");
const router = express.Router();
const { getDomains, createDomain } = require("../controllers/domainController");
const Domain = require("../models/Domain");

// GET /api/domains
router.get("/", getDomains);

// POST /api/domains
router.post("/", createDomain);

router.get("/", async (req, res) => {
  try {
    const domains = await Domain.find({});
    res.json(domains);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;