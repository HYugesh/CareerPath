const Domain = require("../models/Domain");

// GET /api/domains
const getDomains = async (req, res, next) => {
  try {
    const domains = await Domain.find().sort({ name: 1 });
    res.json(domains);
  } catch (err) {
    next(err);
  }
};

// POST /api/domains  (admin capable — currently public)
const createDomain = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "name required" });

    const exists = await Domain.findOne({ name });
    if (exists) return res.status(400).json({ message: "domain exists" });

    const d = new Domain({ name, description });
    await d.save();
    res.status(201).json(d);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDomains, createDomain };