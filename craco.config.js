const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');

module.exports = {
    webpack: {
        plugins: [
            new MonacoWebpackPlugin()
        ]
    }
};
