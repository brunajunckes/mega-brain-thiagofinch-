import { BookIntegrator } = require('@aiox-fullstack/bookme-engine');
import { ProjectManager } = require('@aiox-fullstack/project-manager');

const integrator = new BookIntegrator('/var/lib/bookme');
const pm = new ProjectManager('/var/lib/projects');

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const books = integrator.listBooks();
      return res.status(200).json(books);
    }
    
    if (req.method === 'POST') {
      const { title, author, description, driveUrl } = req.body;
      const project = pm.createProject({ title, description, driveUrl });
      const book = integrator.createBookFromProject(project.id, { author });
      return res.status(201).json(book);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
