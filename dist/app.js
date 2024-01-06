"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cherrio = __importStar(require("cheerio"));
const axios_1 = __importDefault(require("axios"));
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
let bookData = [];
var Rating;
(function (Rating) {
    Rating[Rating["Zero"] = 0] = "Zero";
    Rating[Rating["One"] = 1] = "One";
    Rating[Rating["Two"] = 2] = "Two";
    Rating[Rating["Three"] = 3] = "Three";
    Rating[Rating["Four"] = 4] = "Four";
    Rating[Rating["Five"] = 5] = "Five";
})(Rating || (Rating = {}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('combined'));
const getBooks = (baseURL, initialURL) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(initialURL, {
            headers: {
                'User-Agent': 'custom-user-agent string',
            },
        });
        const $ = cherrio.load(response.data);
        const books = $('article');
        books.each(function () {
            var _a;
            let title = $(this).find('h3 a').text();
            let price = $(this).find('.price_color').text();
            let stock = $(this).find('.availability').text().trim();
            let ratings = $(this).find('.star-rating');
            const classes = (_a = $(ratings)
                .attr('class')) === null || _a === void 0 ? void 0 : _a.split(' ');
            let ratingInNumbers = -1;
            if (classes && (classes === null || classes === void 0 ? void 0 : classes.length) > 1) {
                let ratingInWords = classes[1];
                ratingInNumbers = Rating[ratingInWords];
            }
            bookData.push({
                title,
                price,
                stock,
                rating: ratingInNumbers,
            });
        });
        if ($('.next a').attr('href') && baseURL) {
            let nextPage = baseURL + $('.next a').attr('href');
            yield getBooks(baseURL, nextPage);
        }
        return bookData;
    }
    catch (error) {
        console.error(error);
    }
});
app.get('/', (req, res) => {
    res.status(200).json({
        error: false,
        message: 'Welcome to books-datascrapper-backend',
        nextStep: 'Go to the /books route to get the books data',
    });
});
app.get('/books', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    bookData = [];
    let baseURL = (_a = req === null || req === void 0 ? void 0 : req.body) === null || _a === void 0 ? void 0 : _a.baseURL;
    if (!baseURL) {
        return res.status(500).json({
            error: true,
            message: 'baseURL is a required field!',
        });
    }
    else {
        const books = yield getBooks(baseURL, `${baseURL}index.html`);
        res.status(200).json({
            error: false,
            message: 'Books data scrapped successfully!',
            books,
        });
    }
}));
exports.default = app;
