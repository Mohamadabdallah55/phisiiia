import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const dist = fileURLToPath(new URL('./dist/', import.meta.url));
app.disable('x-powered-by');
app.use(express.static(dist));
app.get('*', (req, res) => {
  if (path.extname(req.path)) return res.sendStatus(404);
  res.sendFile(path.join(dist, 'index.html'));
});
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Physics platform listening on ${port}`));
