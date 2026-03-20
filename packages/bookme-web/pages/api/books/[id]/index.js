const { BookIntegrator } = require('@aiox-fullstack/bookme-engine');

const integrator = new BookIntegrator('/var/lib/bookme');

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (req.method === 'GET') {
      const book = integrator.loadBook(id);
      return book ? res.json(book) : res.status(404).json({ error: 'Not found' });
    }
    if (req.method === 'PUT') {
      return res.json(integrator.updateBook(id, req.body));
    }
    if (req.method === 'DELETE') {
      const fs = require('fs');
      const path = require('path');
      const fp = path.join('/var/lib/bookme', `${id}.json`);
      fs.existsSync(fp) && fs.unlinkSync(fp);
      return res.json({ success: true });
    }
    res.status(405).json({ error: 'Not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
