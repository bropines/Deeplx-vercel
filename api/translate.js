const { translate } = require('../translate');

module.exports = async (req, res) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (req.method !== 'POST' || !req.body || !req.body.text) {
    const duration = Date.now() - startTime;
    console.log(`[LOG] ${new Date().toISOString()} | 404 | ${duration}ms | POST "/translate"`);
    return res.status(404).json({
      code: 404,
      message: 'Путь не найден',
    });
  }

  const { text, source_lang = 'auto', target_lang = 'RU', tag_handling = '', dl_session = '', proxy = '' } = req.body;

  try {
    const result = await translate(text, source_lang, target_lang, tag_handling, dl_session, proxy);
    const duration = Date.now() - startTime;
    console.log(`[LOG] ${new Date().toISOString()} | 200 | ${duration}ms | POST "/translate"`);

    res.json({
      alternatives: result.alternatives,
      code: 200,
      data: result.data,
      id: result.id,
      method: result.method,
      source_lang: result.source_lang,
      target_lang: result.target_lang,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ERROR] ${new Date().toISOString()} | 500 | ${duration}ms | POST "/translate" | ${error.message}`);
    res.status(500).json({ code: 500, message: 'Ошибка перевода', error: error.message });
  }
};
