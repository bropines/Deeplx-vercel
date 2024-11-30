module.exports = (req, res) => {
  res.json({
    code: 200,
    message: "Welcome to the DeepL Free API. Please POST to /api/translate. Visit http://github.com/OwO-Network/DeepLX for more information. \n If ip not working, write issue on github"
  });
};
