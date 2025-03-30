if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const catchAsync = require('./utils/catchAsync');
const contacts = require('./controllers/contacts');
const ejsMate = require('ejs-mate');
const express = require('express');
const ExpressError = require('./utils/ExpressError');
const flash = require('connect-flash');
const helmet = require('helmet');
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const secret = process.env.SECRET || 'thisshouldbebettersecret!';

const sessionConfig = {
    name: 'session', //session name on cookie
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true, //only for https
        express: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
    //store: (dev purposes no need, default goes to local memory, if production need be be define as mongo cookie/cache or the other like redis, etc)
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const defaultSrcUrls = [
    "site.webmanifest"
];
const scriptSrcUrls = [
    "https://cdn.splitbee.io"
];
const styleSrcUrls = [
    "https://cdnjs.cloudflare.com/",
    "https://use.typekit.net/",
    "https://p.typekit.net/"
];
const connectSrcUrls = [
    "https://hive.splitbee.io/"
];
const fontSrcUrls = [
    "https://cdnjs.cloudflare.com/",
    "https://use.typekit.net/",
    "https://p.typekit.net/"
];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", ...defaultSrcUrls],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/de7hcol74/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://bulma.io/"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/', (req, res) => {
    res.render('home', { year: new Date().getFullYear() });
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.post('/contact', catchAsync(contacts.sendClientMessage));

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong!';
    res.status(statusCode).send(err.message);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});
