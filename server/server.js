const http = require('http');
const query = require('querystring');
const staticPage = require('./staticPages.js');
const endpoints = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// handling GET/HEAD requests (ENDPOINTS: /getAll, /getName, /getEvolution, /getImage)
// else: return 404
const handleGet = (request, response, url) => {
  if (url.pathname === '/') {
    staticPage.getIndex(request, response);
  } else if (url.pathname === '/styles.css') {
    staticPage.getStyles(request, response);
  } else if (url.pathname === '/getAll') {
    endpoints.getAll(request, response);
  } else if (url.pathname === '/getEvolution') {
    endpoints.getEvolution(request, response);
  } else if (url.pathname === '/getImage') {
    endpoints.getImage(request, response);
  } else if (url.pathname === '/getName') {
    endpoints.getName(request, response);
  } else {
    endpoints.getNonExistent(request, response);
  }
};

// for handling the POST
const parseBody = (request, response, handler) => {
  const body = [];

  request.on('error', (err) => {
    console.log(err);
    response.statusCode = 400;
    response.end();
  });

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  // CHANGE THIS: server needs to accept *both* JSON and URL-encoded formats
  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const contentType = request.headers['content-type'];

    if (contentType === 'application/x-www-form-urlencoded') {
      request.body = query.parse(bodyString);
    } else if (contentType === 'application/json') {
      request.body = JSON.parse(bodyString);
    }

    handler(request, response);
  });
};

//  handling POST requests (ENDPOINTS: /addPoke, /updatePoke)
const handlePost = (request, response, url) => {
  if (url.pathname === '/addPoke') {
    parseBody(request, response, endpoints.addPoke);
  } else if (url.pathname === '/updatePoke') {
    parseBody(request, response, endpoints.updatePoke);
  }
};

const onRequest = (request, response) => {
  const protocol = request.connection.encrypted ? 'https' : 'http';
  const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

  // QUERY parms
  request.query = Object.fromEntries(parsedUrl.searchParams);

  // if the method is POST, handle post - else handle GET/HEAD
  if (request.method === 'POST') {
    handlePost(request, response, parsedUrl);
  } else {
    handleGet(request, response, parsedUrl);
  }
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
