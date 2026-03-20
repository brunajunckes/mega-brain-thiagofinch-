import { BookIntegrator } from '@aiox-fullstack/bookme-engine';

const integrator = new BookIntegrator('/var/lib/bookme');

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (req.method === 'POST') {
      const { format } = req.body;
      const result = integrator.exportBook(id);
      const filepath = result.exports[format];
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="export.${format}"`);
      const fs = require('fs');
      res.end(fs.readFileSync(filepath));
    } else {
      res.status(405).json({ error: 'Not allowed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
