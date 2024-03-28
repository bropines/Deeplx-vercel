# DeepLX Vercel

A free, serverless solution for DeepL translation API, allowing seamless integration with your applications. Deploy your own instance or run it locally as per your needs.

## Features

- **Serverless Architecture**: Built to leverage the scalability and simplicity of serverless platforms.
- **Easy Deployment**: One-click deployment to Vercel with minimal configuration.
- **Local Development**: Supports local development for testing and modifications. (Either via vercel CLI, or via the method described below)

## Deploying on Vercel

Deploy your own DeepLX translation API by clicking the button below.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbropines%2FDeeplx-vercel)

After clicking the button, simply follow the prompts to set up the API on Vercel.

## Running Locally

Here is the local deployment method described in the [deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless/) repository from [LegendLeo](https://github.com/LegendLeo)

```bash
git clone https://github.com/LegendLeo/deeplx-serverless
cd deeplx-serverless
npm install
npm run start
```

This will start a local server with the API running on `http://localhost:9000`.

## Usage

Once deployed or running locally, you can start making requests to translate text. Make a `POST` request to `/api/translate` with the following JSON structure:

```json
{
  "text": "Your text to translate",
  "source_lang": "Source language code (e.g., 'en')",
  "target_lang": "Target language code (e.g., 'de')"
}
```

The API will respond with the translated text. Here's an example using `curl`:

```bash
curl --location --request POST 'https://your-deployment-url/api/translate' \
--header 'Content-Type: application/json' \
--data-raw '{
    "text": "Hello, World!",
    "source_lang": "en",
    "target_lang": "de"
}'
```

Replace `https://your-deployment-url` with the actual URL of your Vercel deployment or `http://localhost:9000` if you're running locally.

## For Ballon Translator users
After receiving the link in the format `https://your-deployment-url/api/translate` just paste it into `api_url`
<b>
![image](https://github.com/bropines/Deeplx-vercel/assets/57861007/335afdf4-2c3c-4970-b266-2cabdb5c7931)


## Thanks
[LegendLeo](https://github.com/LegendLeo) for the basic serverless implementation.

ChatGPT (Who wrote this readme for me)

[OwO-Network](https://github.com/OwO-Network) for the project [DeepLX](https://github.com/OwO-Network/) 

## Contributing

Contributions are welcome! If you have a suggestion or fix, please fork the repository and submit a pull request.

## License

This project is open-sourced under the MIT license. See the [LICENSE](LICENSE) file for more details.
