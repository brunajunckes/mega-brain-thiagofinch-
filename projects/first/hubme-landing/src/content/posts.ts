export interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  industry: string;
  date: string;
  readTime: number;
  author?: string;
  keywords?: string[];
  content?: string;
}

export const posts: Post[] = [
  {
    id: '1',
    title: 'How AI Chatbots Save 20+ Hours Per Week',
    slug: 'ai-chatbots-save-time',
    description: 'Learn how intelligent chatbots can automate customer support and free up your team to focus on growth.',
    category: 'AI Automation',
    industry: 'Customer Support',
    date: '2024-03-20',
    readTime: 5,
    author: 'HubMe AI',
    keywords: ['AI chatbots', 'customer support', 'automation', 'time savings'],
    content: 'Discover how AI chatbots are revolutionizing customer support...',
  },
  {
    id: '2',
    title: 'Building a Professional Website in 24 Hours',
    slug: 'professional-website-24h',
    description: 'Discover how modern AI-powered development delivers production-ready websites faster than ever before.',
    category: 'Web Development',
    industry: 'E-Commerce',
    date: '2024-03-15',
    readTime: 4,
    author: 'HubMe AI',
    keywords: ['website development', 'fast delivery', 'e-commerce', 'AI development'],
    content: 'In today\'s digital landscape, speed matters...',
  },
  {
    id: '3',
    title: 'The ROI of Automation: Real Numbers',
    slug: 'automation-roi',
    description: 'See real case studies of businesses saving thousands monthly through intelligent automation.',
    category: 'Business Growth',
    industry: 'Manufacturing',
    date: '2024-03-10',
    readTime: 6,
    author: 'HubMe AI',
    keywords: ['automation ROI', 'cost savings', 'business growth', 'case studies'],
    content: 'Automation isn\'t just a buzzword—it\'s a proven path to growth...',
  },
  {
    id: '4',
    title: 'Why Your Business Needs a Custom API',
    slug: 'custom-api-guide',
    description: 'Explore how custom APIs unlock scalability and integration capabilities for growing businesses.',
    category: 'API Development',
    industry: 'SaaS',
    date: '2024-03-05',
    readTime: 5,
    author: 'HubMe AI',
    keywords: ['custom API', 'scalability', 'integrations', 'SaaS'],
    content: 'Custom APIs are the backbone of modern software solutions...',
  },
];
