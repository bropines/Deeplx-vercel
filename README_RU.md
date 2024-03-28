
# DeepLX Vercel

[English](README.md) | [Русский](README_RU.md)

Бесплатное решение на основе serverless для API перевода DeepL, позволяющее легко интегрироваться с вашими приложениями. Разверните свой собственный экземпляр или запустите локально по своим потребностям.

## Особенности

- **Архитектура Serverless**: Построено с использованием масштабируемости и простоты serverless платформ.
- **Легкое развертывание**: Однокликовое развертывание на Vercel с минимальной конфигурацией.
- **Локальная разработка**: Поддерживает локальную разработку для тестирования и изменений. (Либо через Vercel CLI, либо через описанный ниже метод)

## Развертывание на Vercel

Разверните свой собственный API перевода DeepLX, нажав на кнопку ниже.

[![Развернуть с помощью Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbropines%2FDeeplx-vercel)

После нажатия на кнопку просто следуйте инструкциям для настройки API на Vercel.

## Локальный запуск

Вот метод локального развертывания, взятый из репозитория [deeplx-serverless](https://github.com/LegendLeo/deeplx-serverless/) от [LegendLeo](https://github.com/LegendLeo)

```bash
git clone https://github.com/LegendLeo/deeplx-serverless
cd deeplx-serverless
npm install
npm run start
```

Это запустит локальный сервер с API, работающим на `http://localhost:9000`.

## Использование

После развертывания или локального запуска вы можете начать отправлять запросы на перевод текста. Отправьте `POST` запрос на `/api/translate` со следующей структурой JSON:

```json
{
  "text": "Ваш текст для перевода",
  "source_lang": "Код исходного языка (например, 'en')",
  "target_lang": "Код целевого языка (например, 'de')"
}
```

API ответит переведенным текстом. Вот пример использования `curl`:

```bash
curl --location --request POST 'https://your-deployment-url/api/translate' \
--header 'Content-Type: application/json' \
--data-raw '{
    "text": "Hello, World!",
    "source_lang": "en",
    "target_lang": "de"
}'
```

Замените `https://your-deployment-url` на фактический URL вашего развертывания на Vercel или `http://localhost:9000`, если вы работаете локально.

## Для пользователей [Ballon Translator](https://github.com/dmMaze/BallonsTranslator)
После получения ссылки в формате `https://your-deployment-url/api/translate` просто вставьте ее в `api_url`
<b>
![изображение](https://github.com/bropines/Deeplx-vercel/assets/57861007/335afdf4-2c3c-4970-b266-2cabdb5c7931)


## Благодарности
[LegendLeo](https://github.com/LegendLeo) за оригинальную бессерверную реализацию.

ChatGPT (Кто написал для меня этот файл readme)

[OwO-Network](https://github.com/OwO-Network) и их проект [DeepLX](https://github.com/OwO-Network/DeepLX)

## Участие

Предложения приветствуются! Если у вас есть предложение или исправление, пожалуйста, создайте форк репозитория и отправьте pull request.

## Лицензия

Этот проект распространяется под лицензией

 MIT. См. файл [LICENSE](LICENSE) для получения дополнительной информации.
