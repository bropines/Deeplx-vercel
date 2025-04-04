const express = require('express');
const chalk = require('chalk').default;

const args = process.argv.slice(2);
const isDebugMode = args.includes('-d') || args.includes('--debug');

const app = express();
const PORT = process.env.PORT || 3000;

function getStatusColor(statusCode) {
    if (statusCode >= 500) return chalk.redBright;
    if (statusCode >= 400) return chalk.yellowBright;
    if (statusCode >= 300) return chalk.cyanBright;
    if (statusCode >= 200) return chalk.greenBright;
    return chalk.whiteBright; // Default
}

function getMethodColor(method) {
    switch (method.toUpperCase()) {
        case 'GET': return chalk.blueBright;
        case 'POST': return chalk.magentaBright;
        case 'PUT': return chalk.yellow;
        case 'DELETE': return chalk.red;
        case 'OPTIONS': return chalk.grey;
        default: return chalk.white;
    }
}

app.use(express.json());

app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusColor = getStatusColor(status);
        const methodColor = getMethodColor(req.method);

        console.log(
            `${chalk.dim(timestamp)} | ${statusColor(status)} | ${chalk.cyan(duration.toString().padStart(4, ' ') + 'ms')} | ${methodColor(req.method.padEnd(7))} ${chalk.white(req.originalUrl)}`
        );

        if (isDebugMode) {
            console.log(chalk.dim('  ├─ Headers:'), chalk.grey(JSON.stringify(req.headers, null, 2).substring(0, 500) + (JSON.stringify(req.headers).length > 500 ? '...' : ''))); // Log first 500 chars of headers
            if (req.body && Object.keys(req.body).length > 0) {
                // IMPORTANT: Be careful logging bodies in production, might contain sensitive data!
                // Here we log a snippet for debugging.
                console.log(chalk.dim('  └─ Body Snippet:'), chalk.grey(JSON.stringify(req.body).substring(0, 200) + (JSON.stringify(req.body).length > 200 ? '...' : ''))); // Log first 200 chars of body
            } else {
                console.log(chalk.dim('  └─ Body:'), chalk.grey('(empty)'));
            }
        }
    });
    next();
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        console.log(`${chalk.dim(new Date().toISOString())} | ${chalk.grey('204')} | ${chalk.grey('Preflight')} | ${getMethodColor('OPTIONS')('OPTIONS'.padEnd(7))} ${chalk.white(req.originalUrl)}`);
        return res.status(204).end();
    }
    next();
});

const indexHandler = require('./api/index.js');
app.get('/', indexHandler);

const translateHandler = require('./api/translate.js');
app.post('/api/translate', translateHandler);

app.use((req, res) => {
    res.status(404).json({
        code: 404,
        message: "Path not found",
    });
});


app.listen(PORT, () => {
    console.log(chalk.green(`[INFO] Server running on http://localhost:${PORT}`));
    if (isDebugMode) {
        console.log(chalk.yellow('[DEBUG] Debug mode enabled. Verbose logging active.'));
    } else {
        console.log(chalk.blue('[INFO] Logging enabled (standard). Use -d or --debug for verbose logs.'));
    }
    console.log(chalk.blue('[INFO] Ready for requests...'));
});