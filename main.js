const axios = require('axios').default;
const zlib = require('zlib');
const brotli = require('brotli');

const DEEPL_BASE_URL = 'https://www2.deepl.com/jsonrpc';

function getICount(translateText) {
  return (translateText || '').split('i').length - 1;
}

function getRandomNumber() {
  const src = crypto.getRandomValues(new Uint32Array(1))[0];
  return (src % 99999 + 8300000) * 1000;
}

function getTimeStamp(iCount) {
  const ts = Date.now();
  if (iCount !== 0) {
    iCount = iCount + 1;
    return ts - (ts % iCount) + iCount;
  }
  return ts;
}

function formatPostString(postData) {
  let postStr = JSON.stringify(postData);

  if ((postData.id + 5) % 29 === 0 || (postData.id + 3) % 13 === 0) {
    postStr = postStr.replace('"method":"', '"method" : "');
  } else {
    postStr = postStr.replace('"method":"', '"method": "');
  }

  return postStr;
}

async function makeRequest(postData, dlSession = '', proxy = '') {
  const urlFull = `${DEEPL_BASE_URL}`;
  const postStr = formatPostString(postData);

  // **Debug Logging - Added Here:**
  console.log("JSON Payload отправляется в DeepL:", JSON.stringify(postData, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'DeepL/1627620 CFNetwork/3826.500.62.2.1 Darwin/24.4.0',
    'Accept': '*/*',
    'X-App-Os-Name': 'iOS',
    'X-App-Os-Version': '18.4.0',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'X-App-Device': 'iPhone16,2',
    'Referer': 'https://www.deepl.com/',
    'X-Product': 'translator',
    'X-App-Build': '1627620',
    'X-App-Version': '25.1',
  };

  if (dlSession) {
    headers['Cookie'] = `dl_session=${dlSession}`;
  }

  const axiosOptions = {
    method: 'POST',
    url: urlFull,
    headers: headers,
    data: postStr,
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
      data = brotli.decompress(response.data).toString('utf-8');
    } else if (encoding === 'gzip') {
      data = zlib.gunzipSync(response.data).toString('utf-8');
    } else if (encoding === 'deflate') {
      data = zlib.inflateRawSync(response.data).toString('utf-8');
    }
    else {
      data = response.data.toString('utf-8');
    }


    if (response.status >= 400) {
      throw new Error(`Ошибка от сервера DeepL: ${response.status} - ${data}`);
    }

    return JSON.parse(data);
  } catch (err) {
    throw err;
  }
}


async function translate(
  text,
  sourceLang = 'auto',
  targetLang = 'RU',
  tagHandling = 'plaintext',
  dlSession = '',
  proxy = ''
) {
  if (!text) {
    throw new Error('Нет текста для перевода.');
  }

  if (!tagHandling) {
    tagHandling = 'plaintext';
  }

  const textParts = text.split('\n');
  const translatedParts = [];
  const allAlternatives = [];

  for (const part of textParts) {
    if (part.trim() === '') {
      translatedParts.push('');
      allAlternatives.push(['']);
      continue;
    }

    let currentSourceLang = sourceLang;
    if (sourceLang === 'auto' || sourceLang === '') {
      currentSourceLang = 'auto';
    }

    const jobs = [];
    jobs.push({
      kind: 'default',
      preferred_num_beams: 4,
      raw_en_context_before: [],
      raw_en_context_after: [],
      sentences: [{
        prefix: '',
        text: part,
        id: 0,
      }],
    });


    let hasRegionalVariant = false;
    let targetLangCode = targetLang;
    const targetLangParts = targetLang.split('-');
    if (targetLangParts.length > 1) {
      targetLangCode = targetLangParts[0];
      hasRegionalVariant = true;
    }

    const id = getRandomNumber();

    let postData = {
      jsonrpc: '2.0',
      method: 'LMT_handle_jobs',
      id: id,
      params: {
        commonJobParams: {
          mode: 'translate',
          formality: 'undefined',
          transcribeAs: 'romanize',
          advancedMode: false,
          textType: tagHandling,
          wasSpoken: false,
        },
        lang: {
          source_lang_user_selected: 'auto',
          target_lang: targetLangCode.toUpperCase(),
          source_lang_computed: currentSourceLang.toUpperCase(),
        },
        jobs: jobs,
        timestamp: getTimeStamp(getICount(part)),
      },
    };


    if (hasRegionalVariant) {
      postData.params.commonJobParams.regionalVariant = targetLang;
    }


    const response = await makeRequest(postData, dlSession, proxy);

    if (!response || !response.result) {
      throw new Error('Не удалось выполнить перевод.');
    }

    let partTranslation = '';
    let partAlternatives = [];

    const translations = response.result.translations;
    if (translations && translations.length > 0) {
      for (const translation of translations) {
        partTranslation += translation.beams[0].sentences[0].text + ' ';
      }
      partTranslation = partTranslation.trim();

      const numBeams = translations[0].beams.length;
      for (let i = 1; i < numBeams; i++) {
        let altText = '';
        for (const translation of translations) {
          if (i < translation.beams.length) {
            altText += translation.beams[i].sentences[0].text + ' ';
          }
        }
        if (altText.trim() !== '') {
          partAlternatives.push(altText.trim());
        }
      }
    }


    if (!partTranslation) {
      throw new Error('Перевод не получен.');
    }

    translatedParts.push(partTranslation);
    allAlternatives.push(partAlternatives);
  }

  const translatedText = translatedParts.join('\n');

  let combinedAlternatives = [];
  const maxAlts = Math.max(...allAlternatives.map(alts => alts.length));

  for (let i = 0; i < maxAlts; i++) {
    let altParts = [];
    for (let j = 0; j < allAlternatives.length; j++) {
      if (i < allAlternatives[j].length) {
        altParts.push(allAlternatives[j][i]);
      } else if (translatedParts[j] === '') {
        altParts.push('');
      }
      else {
        altParts.push(translatedParts[j]);
      }
    }
    combinedAlternatives.push(altParts.join('\n'));
  }

  const result = {
    code: 200,
    id: getRandomNumber(),
    data: translatedText,
    alternatives: combinedAlternatives,
    source_lang: sourceLang,
    target_lang: targetLang,
    method: dlSession ? 'Pro' : 'Free',
  };

  return result;
}

module.exports = {
  translate: translate,
};
