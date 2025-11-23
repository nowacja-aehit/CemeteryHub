import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

const articles = [
  {
    id: 1,
    title: 'Choosing the Right Tombstone Material: A Complete Guide',
    excerpt: 'Understanding the differences between granite, marble, and bronze can help you make an informed decision that will last for generations.',
    date: '2024-11-15',
    category: 'Materials',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'Tombstone Maintenance: Seasonal Care Tips',
    excerpt: 'Learn how to properly care for and maintain tombstones through different seasons to preserve their beauty and integrity.',
    date: '2024-11-10',
    category: 'Maintenance',
    readTime: '4 min read',
  },
  {
    id: 3,
    title: 'The History of Cemetery Symbolism',
    excerpt: 'Discover the meanings behind common symbols found on tombstones, from angels and doves to crosses and flowers.',
    date: '2024-11-05',
    category: 'History',
    readTime: '7 min read',
  },
  {
    id: 4,
    title: 'Restoration vs. Replacement: Making the Right Choice',
    excerpt: 'When a tombstone shows signs of wear, understanding when to restore versus replace can save money and preserve history.',
    date: '2024-10-28',
    category: 'Restoration',
    readTime: '6 min read',
  },
  {
    id: 5,
    title: 'Modern Tombstone Design Trends',
    excerpt: 'Explore contemporary approaches to memorial design, from laser etching to custom sculptures and personalized engravings.',
    date: '2024-10-20',
    category: 'Design',
    readTime: '5 min read',
  },
  {
    id: 6,
    title: 'Environmental Considerations in Cemetery Planning',
    excerpt: 'Learn about eco-friendly burial options and sustainable cemetery practices that are better for the environment.',
    date: '2024-10-12',
    category: 'Environment',
    readTime: '6 min read',
  },
];

export function ArticlesSection() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-slate-900">Tombstone Knowledge Center</h2>
        <p className="text-slate-600">
          Expert insights and guides for making informed decisions
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="p-6 hover:shadow-lg transition-all group">
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">{article.category}</Badge>
                <h3 className="text-slate-900 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
              </div>

              <p className="text-slate-600">
                {article.excerpt}
              </p>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Calendar className="size-4" />
                  <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="text-slate-500 text-sm">{article.readTime}</span>
              </div>

              <Button variant="link" className="px-0 group-hover:gap-2 transition-all">
                Read More
                <ArrowRight className="size-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
