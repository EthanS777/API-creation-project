const fs = require('fs');

// read in client page from fs
const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const styles = fs.readFileSync(`${__dirname}/../client/styles.css`);

// get the client page
const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const getStyles = (request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/css'});
    response.write(styles);
    response.end();
}

module.exports = {
  getIndex, getStyles
};
