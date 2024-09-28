const http = require('http');
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
  }  else {
    endpoints.getNonExistent(request, response);
  }
};

//  handling POST requests (ENDPOINTS: )
// const handlePost = (request, response, url) => {
//     we'll do this later
// }

const onRequest = (request, response) => {
  const protocol = request.connection.encrypted ? 'https' : 'http';
  const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

  // QUERY parms
  request.query = Object.fromEntries(parsedUrl.searchParams);

  // if the method is POST, handle post - else handle GET/HEAD
  if (request.method === 'POST') {
    // handlePost(request, response, parsedUrl);
  } else {
    handleGet(request, response, parsedUrl);
  }
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
