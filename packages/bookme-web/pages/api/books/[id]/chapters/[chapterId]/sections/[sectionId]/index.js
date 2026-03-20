import { BookIntegrator, BookProcessor } from '@aiox-fullstack/bookme-engine';

const integrator = new BookIntegrator('/var/lib/bookme');

export default function handler(req, res) {
  try {
    const { id, chapterId, sectionId } = req.query;
    if (req.method === 'PUT') {
      const book = integrator.loadBook(id);
      BookProcessor.editSection(book, chapterId, sectionId, req.body);
      integrator.saveBook(book);
      return res.json({ success: true });
    }
    res.status(405).json({ error: 'Not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
