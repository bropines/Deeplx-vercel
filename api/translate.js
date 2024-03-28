const { translate } = require('../translate'); // Импортируем функцию перевода

module.exports = async (req, res) => {
  const { text, source_lang, target_lang } = req.body;

  try {
    const result = await translate(text, source_lang, target_lang);
    res.json({
      alternatives: result.alternatives,
      code: 200,
      data: result.text,
      id: Math.floor(Math.random() * 10000000000),
      method: 'Free',
      source_lang,
      target_lang,
    });
  } catch (error) {
    res.status(500).json({ error: 'Translation failed' });
  }
};
