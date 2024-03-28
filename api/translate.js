const { translate } = require('../translate');

module.exports = async (req, res) => {
  const startTime = Date.now();
  
  if (req.method !== 'POST' || !req.body || !req.body.text) {
    const duration = Date.now() - startTime;
    console.log(`[LOG] ${new Date().toISOString()} | 404 | ${duration}ms | POST "/translate"`);
    return res.status(404).json({
      "code": 404,
      "message": "Path not found"
    });
  }

  const { text, source_lang = 'AUTO', target_lang = 'RU' } = req.body;

  try {
    const result = await translate(text, source_lang, target_lang);
    const duration = Date.now() - startTime;
    console.log(`[LOG] ${new Date().toISOString()} | 200 | ${duration}ms | POST "/translate"`);
    
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
    const duration = Date.now() - startTime;
    console.error(`[ERROR] ${new Date().toISOString()} | 500 | ${duration}ms | POST "/translate" | ${error.message}`);
    res.status(500).json({ code: 500, message: 'Translation failed', error: error.message });
  }
};
