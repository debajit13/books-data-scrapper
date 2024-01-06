import express, { Request, Response } from 'express';
import * as cherrio from 'cheerio';
import axios from 'axios';
import morgan from 'morgan';
import { Book } from './interfaces/Book.interface';
const app = express();
let bookData: Book[] = [];

enum Rating {
  Zero = 0,
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
}

app.use(express.json());
app.use(morgan('combined'));

const getBooks = async (baseURL: string, initialURL: string) => {
  try {
    const response = await axios.get(initialURL, {
      headers: {
        'User-Agent': 'custom-user-agent string',
      },
    });
    const $ = cherrio.load(response.data);
    const books = $('article');
    books.each(function () {
      let title = $(this).find('h3 a').text();
      let price = $(this).find('.price_color').text();
      let stock = $(this).find('.availability').text().trim();
      let ratings = $(this).find('.star-rating');
      const classes: string[] | undefined = $(ratings)
        .attr('class')
        ?.split(' ');

      let ratingInNumbers: number = -1;
      if (classes && classes?.length > 1) {
        let ratingInWords = classes[1];
        ratingInNumbers = Rating[ratingInWords as keyof typeof Rating];
      }
      bookData.push({
        title,
        price,
        stock,
        rating: ratingInNumbers,
      });
    });

    if ($('.next a').attr('href') && baseURL) {
      let nextPage: string = baseURL + $('.next a').attr('href');
      await getBooks(baseURL, nextPage);
    }
    return bookData;
  } catch (error) {
    console.error(error);
  }
};

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    error: false,
    message: 'Welcome to books-datascrapper-backend',
    nextStep: 'Go to the /books route to get the books data',
  });
});

app.get('/books', async (req: Request, res: Response) => {
  bookData = [];
  let baseURL = req?.body?.baseURL;

  if (!baseURL) {
    return res.status(500).json({
      error: true,
      message: 'baseURL is a required field!',
    });
  } else {
    const books = await getBooks(baseURL, `${baseURL}index.html`);
    res.status(200).json({
      error: false,
      message: 'Books data scrapped successfully!',
      books,
    });
  }
});

export default app;
