const path = require('path');


module.exports = {
    entry: path.join(process.cwd(), './src/traisi-questions.module.ts'),
    output: {
        path: path.join(process.cwd(), 'dist'),
        filename: 'traisi-questions.module.js',
        libraryTarget: 'amd'
    },
    resolve: {
        extensions: [
            '.ts',
            '.js'
        ]
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader'
            },
            {
                test: /\.html?$/,
                loader: 'raw-loader'
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader", // creates style nodes from JS strings
                    "css-loader", // translates CSS into CommonJS
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader", // creates style nodes from JS strings
                    "css-loader", // translates CSS into CommonJS
                    "sass-loader" // compiles Sass to CSS
                ]
            }]
        
    },
    /*externals: [
        function (context, request, callback) {
            if (/^@angular/.test(request)) {
                return callback(null, 'umd ' + request);
            }
            callback();
        }
    ],*/
    externals: /^@angular/,
    plugins: [
        //snew UglifyJsPlugin()
      ]
};