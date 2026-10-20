// Last-resort handling, so a failure never leaks details to the browser.

function notFound(req, res) {
  res.status(404).json({ error: 'not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Bad input that body-parser rejected: tell the caller what was wrong with it.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'request body is not valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'request body is too large' });
  }

  // Anything else is our fault: keep the details in the server log only.
  console.error(`[error] ${req.method} ${req.originalUrl}: ${err.message}`);
  res.status(500).json({ error: 'something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
