const axios = require('axios').default;
const zlib = require('zlib');

const DEEPL_BASE_URL = 'https://www2.deepl.com/jsonrpc';

function getICount(translateText) {
  return (translateText || '').split('i').length - 1;
}

function getRandomNumber() {
  return Math.floor(Math.random() * (8399998 - 8300000 + 1)) + 8300000;
}

function getTimestamp(iCount) {
  const ts = Date.now();
  if (iCount === 0) {
    return ts;
  }
  iCount++;
  return ts - (ts % iCount) + iCount;
}

function isRichText(text) {
  return text.includes('<') && text.includes('>');
}

function formatPostString(postData) {
  let postStr = JSON.stringify(postData);
  const id = postData.id;

  if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
    postStr = postStr.replace('"method":"', '"method" : "');
  } else {
    postStr = postStr.replace('"method":"', '"method": "');
  }

  return postStr;
}

async function makeRequest(postData, method, dlSession = '', proxy = '') {
  const url = `${DEEPL_BASE_URL}?client=chrome-extension%2C1.28.0&method=${method}`;
  const postDataStr = formatPostString(postData);

  const headers = {
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br', // Добавлено
    'Authorization': 'None',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    'DNT': '1',
    'Origin': 'chrome-extension://cofdbpoegempjloogbagkncekinflcnj',
    'Pragma': 'no-cache',
    'Priority': 'u=1, i',
    'Referer': 'https://www.deepl.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'none',
    'Sec-GPC': '1',
    'User-Agent': 'DeepLBrowserExtension/1.28.0 Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  };

  if (dlSession) {
    headers['Cookie'] = `dl_session=${dlSession}`;
  }

  const axiosOptions = {
    method: 'POST',
    url: url,
    headers: headers,
    data: postDataStr,
    responseType: 'arraybuffer',
    decompress: false,
    validateStatus: function (status) {
      return status >= 200 && status < 500;
    },
  };

  if (proxy) {
    const [host, port] = proxy.split(':');
    axiosOptions.proxy = {
      host: host,
      port: parseInt(port, 10),
    };
  } else {
    axiosOptions.proxy = false;
  }

  try {
    const response = await axios(axiosOptions);

    let data;
    const encoding = response.headers['content-encoding'];
    if (encoding === 'br') {
      data = zlib.brotliDecompressSync(response.data).toString();
    } else if (encoding === 'gzip') {
      data = zlib.gunzipSync(response.data).toString(); // Обработка Gzip
    } else {
      data = response.data.toString();
    }

    if (response.status >= 400) {
      throw new Error(`Ошибка от сервера DeepL: ${response.status} - ${data}`);
    }

    return JSON.parse(data);
  } catch (err) {
    throw err;
  }
}

async function splitText(text, tagHandling) {
  const id = getRandomNumber();
  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_split_text',
    id: id,
    params: {
      texts: [text],
      lang: {
        lang_user_selected: 'auto',
      },
      splitting: 'newlines',
      text_type: tagHandling || isRichText(text) ? 'richtext' : 'plaintext',
    },
  };

  const response = await makeRequest(postData, 'LMT_split_text');
  return response;
}

async function translate(
  text,
  sourceLang = 'auto',
  targetLang = 'RU',
  tagHandling = '',
  dlSession = '',
  proxy = ''
) {
  if (!text) {
    throw new Error('Нет текста для перевода.');
  }

  const splitResult = await splitText(text, tagHandling === 'html' || tagHandling === 'xml');
  if (!splitResult || !splitResult.result) {
    throw new Error('Не удалось разделить текст.');
  }

  const detectedSourceLang = splitResult.result.lang.detected || sourceLang;

  const jobs = [];
  const chunks = splitResult.result.texts[0].chunks;
  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    const sentence = chunk.sentences[0];

    const contextBefore = idx > 0 ? [chunks[idx - 1].sentences[0].text] : [];
    const contextAfter = idx < chunks.length - 1 ? [chunks[idx + 1].sentences[0].text] : [];

    jobs.push({
      kind: 'default',
      preferred_num_beams: 4,
      raw_en_context_before: contextBefore,
      raw_en_context_after: contextAfter,
      sentences: [
        {
          id: idx + 1,
          prefix: sentence.prefix,
          text: sentence.text,
        },
      ],
    });
  }

  let hasRegionalVariant = false;
  let targetLangCode = targetLang;
  const targetLangParts = targetLang.split('-');
  if (targetLangParts.length > 1) {
    targetLangCode = targetLangParts[0];
    hasRegionalVariant = true;
  }

  const iCount = getICount(text);
  const id = getRandomNumber();

  const commonJobParams = {
    mode: 'translate',
    ...(hasRegionalVariant && { regionalVariant: targetLang }),
  };

  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_handle_jobs',
    id: id,
    params: {
      jobs: jobs,
      lang: {
        source_lang_computed: detectedSourceLang.toUpperCase(),
        target_lang: targetLangCode.toUpperCase(),
      },
      priority: 1,
      commonJobParams: commonJobParams,
      timestamp: getTimestamp(iCount),
    },
  };

  const response = await makeRequest(postData, 'LMT_handle_jobs', dlSession, proxy);

  if (!response || !response.result) {
    throw new Error('Не удалось выполнить перевод.');
  }

  const translations = response.result.translations;
  let translatedText = '';
  let alternatives = [];

  if (translations && translations.length > 0) {
    const numBeams = translations[0].beams.length;
    for (let i = 0; i < numBeams; i++) {
      let altText = '';
      for (const translation of translations) {
        if (i < translation.beams.length) {
          altText += translation.beams[i].sentences.map(s => s.text).join(' ');
        }
      }
      if (altText) {
        alternatives.push(altText);
      }
    }

    for (const translation of translations) {
      translatedText += translation.beams[0].sentences.map(s => s.text).join(' ') + ' ';
    }
    translatedText = translatedText.trim();
  }

  if (!translatedText) {
    throw new Error('Перевод не получен.');
  }

  const result = {
    code: 200,
    id: id,
    data: translatedText,
    alternatives: alternatives,
    source_lang: detectedSourceLang,
    target_lang: targetLang,
    method: dlSession ? 'Pro' : 'Free',
  };

  return result;
}

exports.translate = translate;
