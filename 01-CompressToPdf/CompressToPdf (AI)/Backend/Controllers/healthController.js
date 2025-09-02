const healthController = (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString()
  });
};

module.exports = healthController;
