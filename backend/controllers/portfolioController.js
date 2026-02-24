const User = require('../models/User');

const addPortfolio = async (req, res) => {
    try {
        const { title, url } = req.body;
        if (!title || !url) {
            return res.status(400).json({ message: 'Title and URL are required' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { portfolios: { title, url } } },
            { new: true }
        );

        res.json(user.portfolios);
    } catch (err) {
        console.error('Add portfolio error:', err);
        res.status(500).json({ message: 'Failed to add portfolio link' });
    }
};

const getPortfolios = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user.portfolios || []);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch portfolios' });
    }
};

const deletePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { portfolios: { _id: id } } },
            { new: true }
        );
        res.json(user.portfolios);
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete portfolio link' });
    }
};

module.exports = {
    addPortfolio,
    getPortfolios,
    deletePortfolio
};
