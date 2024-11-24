const axios = require('axios').default;
const { random } = require('lodash');

const DEEPL_BASE_URL = 'https://www2.deepl.com/jsonrpc';
const headers = {
  'Content-Type': 'application/json',
  Accept: '*/*',
  'x-app-os-name': 'iOS',
  'x-app-os-version': '16.3.0',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'x-app-device': 'iPhone13,2',
  'User-Agent': 'DeepL-iOS/2.9.1 iOS 16.3.0 (iPhone13,2)',
  'x-app-build': '510265',
  'x-app-version': '2.9.1',
  Connection: 'keep-alive',
};

/**
 * Counts the number of 'i' characters in the text.
 * @param {string} translateText - The text to analyze.
 * @returns {number} - The count of 'i' characters.
 */
function getICount(translateText) {
  return (translateText || '').split('i').length - 1;
}

/**
 * Generates a random number for request ID.
 * @returns {number} - A random number.
 */
function getRandomNumber() {
  return random(8300000, 8399999) * 1000;
}

/**
 * Generates a timestamp adjusted based on the 'i' count.
 * @param {number} iCount - The count of 'i' characters.
 * @returns {number} - The adjusted timestamp.
 */
function getTimestamp(iCount) {
  const ts = Date.now();
  if (iCount === 0) {
    return ts;
  }
  iCount++;
  return ts - (ts % iCount) + iCount;
}

/**
 * Checks if the text contains HTML-like tags.
 * @param {string} text - The text to check.
 * @returns {boolean} - True if text contains tags, false otherwise.
 */
function isRichText(text) {
  return text.includes('<') && text.includes('>');
}

/**
 * Makes a request to DeepL API.
 * @param {object} postData - The data to send in the request.
 * @param {string} method - The method name for the API call.
 * @param {string} [dlSession=''] - Optional session token for Pro accounts.
 * @returns {object} - The parsed JSON response from the API.
 */
async function makeRequest(postData, method, dlSession = '') {
  const url = `${DEEPL_BASE_URL}?client=chrome-extension,1.28.0&method=${method}`;
  let postDataStr = JSON.stringify(postData);

  const id = postData.id;
  if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
    postDataStr = postDataStr.replace('"method":"', '"method" : "');
  } else {
    postDataStr = postDataStr.replace('"method":"', '"method": "');
  }

  const requestHeaders = {
    ...headers,
    ...(dlSession && { Cookie: `dl_session=${dlSession}` }),
  };

  try {
    const response = await axios.post(url, postDataStr, {
      headers: requestHeaders,
    });

    if (response.status === 429) {
      throw new Error(
        `Too many requests. Your IP has been temporarily blocked by DeepL. Please avoid making too many requests in a short period.`
      );
    }

    if (response.status !== 200) {
      console.error('Error', response.status);
      return null;
    }

    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * Splits the text using DeepL's split text API.
 * @param {string} text - The text to split.
 * @param {string} tagHandling - Tag handling option ('html', 'xml', or '').
 * @returns {object} - The response from the split text API.
 */
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
      text_type: tagHandling || isRichText(text) ? 'richtext' : 'plain',
    },
  };

  const response = await makeRequest(postData, 'LMT_split_text');
  return response;
}

/**
 * Translates text using DeepL's API.
 * @param {string} text - The text to translate.
 * @param {string} [sourceLang='auto'] - Source language code.
 * @param {string} [targetLang='RU'] - Target language code.
 * @param {string} [tagHandling=''] - Tag handling option ('html', 'xml', or '').
 * @param {number} [numberAlternative=0] - Number of alternative translations.
 * @param {boolean} [printResult=false] - Whether to print the result.
 * @param {string} [dlSession=''] - Optional session token for Pro accounts.
 * @returns {object} - The translation result.
 */
async function translate(
  text,
  sourceLang = 'auto',
  targetLang = 'RU',
  tagHandling = '',
  numberAlternative = 0,
  printResult = false,
  dlSession = ''
) {
  if (!text) {
    throw new Error('No text provided for translation.');
  }

  const splitResult = await splitText(text, tagHandling);
  if (!splitResult || !splitResult.result) {
    throw new Error('Failed to split the text.');
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
      raw_en_context_before: contextBefore,
      raw_en_context_after: contextAfter,
      preferred_num_beams: numberAlternative + 1,
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

  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_handle_jobs',
    id: id,
    params: {
      jobs: jobs,
      lang: {
        source_lang_user_selected: detectedSourceLang.toUpperCase(),
        target_lang: targetLangCode.toUpperCase(),
      },
      priority: 1,
      commonJobParams: {
        mode: 'translate',
        ...(hasRegionalVariant && { regionalVariant: targetLang }),
      },
      timestamp: getTimestamp(iCount),
    },
  };

  const response = await makeRequest(postData, 'LMT_handle_jobs', dlSession);

  if (!response || !response.result) {
    throw new Error('Translation failed.');
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
          altText += translation.beams[i].sentences[0].text;
        }
      }
      if (altText) {
        alternatives.push(altText);
      }
    }

    for (const translation of translations) {
      translatedText += translation.beams[0].sentences[0].text + ' ';
    }
    translatedText = translatedText.trim();
  }

  if (!translatedText) {
    throw new Error('No translation received.');
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

  if (printResult) {
    console.log(result);
  }

  return result;
}

exports.translate = translate;
