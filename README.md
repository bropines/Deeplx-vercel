DeepLX Vercel
=============

[English](README.md) | [Русский](README_RU.md)

A free, serverless solution for DeepL translation API, allowing seamless integration with your applications. Deploy your own instance or run it locally as per your needs.

Features
--------

* **Serverless Architecture**: Built to leverage the scalability and simplicity of serverless platforms.
* **Easy Deployment**: One-click deployment to Vercel with minimal configuration.
* **Local Development**: Supports local development for testing and modifications. (Either via Vercel CLI, or via the method described below)
* **Updated API Logic**: Compatible with the latest DeepLX API changes for reliable translations.

Deploying on Vercel
-------------------

Deploy your own DeepLX translation API by clicking the button below.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbropines%2FDeeplx-vercel)

After clicking the button, simply follow the prompts to set up the API on Vercel.

Running Locally
---------------

Here is the local deployment method described in the [deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless/) repository from [LegendLeo](https://github.com/LegendLeo)

```bash
git clone https://github.com/LegendLeo/deeplx-serverless
cd deeplx-serverless
npm install
npm run start
```

This will start a local server with the API running on `http://localhost:9000`.

Usage
-----

Once deployed or running locally, you can start making requests to translate text. Make a `POST` request to `/api/translate` with the following JSON structure:

```json
{
  "text": "Your text to translate",
  "source_lang": "Source language code (e.g., 'EN')",
  "target_lang": "Target language code (e.g., 'DE')",
  "tag_handling": "Optional tag handling ('html', 'xml', or leave blank)"
}
```

**Parameters:**

* `text` **(required)**: The text you want to translate.
* `source_lang` _(optional)_: The language code of the source text (e.g., `'EN'`). Use `'auto'` for automatic detection. Default is `'auto'`.
* `target_lang` **(required)**: The language code to translate the text into (e.g., `'DE'`).
* `tag_handling` _(optional)_: Specify `'html'` or `'xml'` if your text contains such tags and you want them to be handled properly.

**Example using `curl`:**

```bash
curl --location --request POST 'https://your-deployment-url/api/translate' \
--header 'Content-Type: application/json' \
--data-raw '{
    "text": "Hello, World!",
    "source_lang": "EN",
    "target_lang": "DE",
    "tag_handling": ""
}'
```

Replace `https://your-deployment-url` with the actual URL of your Vercel deployment or `http://localhost:9000` if you're running locally.

**Response:**

The API will respond with a JSON object containing the translation and additional information:

```json
{
  "code": 200,
  "id": 1234567890,
  "data": "Hallo, Welt!",
  "alternatives": ["Hallo, Welt!"],
  "source_lang": "EN",
  "target_lang": "DE",
  "method": "Free"
}
```

* `code`: HTTP status code.
* `id`: A unique identifier for the translation request.
* `data`: The translated text.
* `alternatives`: An array of alternative translations.
* `source_lang`: The detected or specified source language.
* `target_lang`: The target language for translation.
* `method`: Indicates whether the translation used the `'Free'` or `'Pro'` method.

Important Notes
---------------

* **Rate Limiting**: Excessive requests may result in temporary blocking by DeepL. Please avoid sending too many requests in a short period.
* **Usage Limitations**: This API is intended for personal or development use. For commercial use, consider subscribing to DeepL's official API.
* **No Guarantee**: As this API relies on DeepL's public endpoints, functionality may break if DeepL changes their API. Please report issues or contribute fixes if this occurs.

For [Ballon Translator](https://github.com/dmMaze/BallonsTranslator) users
---------------------------

After receiving the link in the format `https://your-deployment-url/api/translate`, just paste it into `api_url`.

![image](https://github.com/bropines/Deeplx-vercel/assets/57861007/335afdf4-2c3c-4970-b266-2cabdb5c7931)

### For Auto-Update

Just in case I think of something clever, I borrowed `sync.yml` from [drmartinmar/Deeplx-vercel](https://github.com/drmartinmar/Deeplx-vercel). Thank you.

* To make it work, you have to manually go into **Actions** and run the workflow.

Thanks
------

* [LegendLeo](https://github.com/LegendLeo) for the basic serverless implementation.
* [OwO-Network](https://github.com/OwO-Network) for the project [DeepLX](https://github.com/OwO-Network/DeepLX).
* ChatGPT (who helped write this README)

Contributing
------------

Contributions are welcome! If you have a suggestion or fix, please fork the repository and submit a pull request.

License
-------

This project is open-sourced under the MIT license. See the [LICENSE](LICENSE) file for more details.
