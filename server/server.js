const http = require('http');
const staticPage = require('./staticPages.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// handling GET/HEAD requests
const handleGet = (request, response, url) => {
  if (url.pathname === '/') {
    staticPage.getIndex(request, response);
  }
  else if (url.pathname === '/styles.css') {
    staticPage.getStyles(request, response);
  }
};

//  handling POST requests
// const handlePost = (request, response, url) => {
//     we'll do this later
// }

const onRequest = (request, response) => {
  const protocol = request.connection.encrypted ? 'https' : 'http';
  const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

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
