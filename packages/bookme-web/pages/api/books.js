const { BookIntegrator } = require('@aiox-fullstack/bookme-engine');
const { ProjectManager } = require('@aiox-fullstack/project-manager');

// Create a custom integrator that knows where projects are stored
const bookmeDataDir = '/var/lib/bookme';
const projectsDir = '/var/lib/projects';

// Create integrator with base dir pointing to bookme storage
// Then pass project manager separately
const integrator = new BookIntegrator(bookmeDataDir);
integrator.pm = new ProjectManager(projectsDir);
const pm = integrator.pm;

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
