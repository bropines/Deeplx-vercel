const { translate } = require('../translate'); // Импортируем функцию перевода

module.exports = async (req, res) => {
  // Проверяем, что метод POST и тело запроса содержат необходимые данные
  if (req.method !== 'POST' || !req.body || !req.body.text) {
    return res.status(404).json({
      "code": 404,
      "message": "Path not found"
    });
  }

  const { text, source_lang = 'AUTO', target_lang = 'RU' } = req.body;

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
    // Логируем ошибку для отладки
    console.error("Error during translation:", error);
    res.status(500).json({ code: 500, message: 'Translation failed', error: error.message });
  }
};
