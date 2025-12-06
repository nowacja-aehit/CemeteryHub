import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { GraveSearch } from './components/GraveSearch';
import { CemeteryMap } from './components/CemeteryMap';
import { ServiceOrder } from './components/ServiceOrder';
import { ArticlesSection } from './components/ArticlesSection';
import { ContactDialog } from './components/ContactDialog';
import { FAQDialog } from './components/FAQDialog';
import { ReservationDialog } from './components/ReservationDialog';
import { Logo } from './components/Logo';
import { Search, Wrench, BookOpen, Phone, HelpCircle, Calendar } from 'lucide-react';

export interface GraveLocation {
  id: string;
  name: string;
  birthDate: string;
  deathDate: string;
  section: string;
  row: number;
  plot: number;
  coordinates: { x: number; y: number };
}

export default function App() {
  const [graves, setGraves] = useState<GraveLocation[]>([]);
  const [selectedGrave, setSelectedGrave] = useState<GraveLocation | null>(null);
  const [activeTab, setActiveTab] = useState('search');
  const [contactOpen, setContactOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);

  useEffect(() => {
    fetch('/api/graves')
      .then(res => res.json())
      .then(data => {
        // Ensure ID is string
        const formattedData = data.map((g: any) => ({
          ...g,
          id: String(g.id)
        }));
        setGraves(formattedData);
      })
      .catch(err => console.error('Failed to fetch graves:', err));
  }, []);

  const handleGraveSelect = (grave: GraveLocation) => {
    setSelectedGrave(grave);
    setActiveTab('map');
  };

  const handleServiceOrder = (grave: GraveLocation) => {
    setSelectedGrave(grave);
    setActiveTab('services');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Logo />
            
            {/* Navigation Links */}
            <nav className="flex flex-wrap items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-slate-800"
                onClick={() => setContactOpen(true)}
              >
                <Phone className="size-4 mr-2" />
                Contact Us
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-slate-800"
                onClick={() => setFaqOpen(true)}
              >
                <HelpCircle className="size-4 mr-2" />
                FAQ
              </Button>
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setReservationOpen(true)}
              >
                <Calendar className="size-4 mr-2" />
                Make a Reservation
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="size-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Search className="size-4" />
              Map
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Wrench className="size-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <BookOpen className="size-4" />
              Articles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <GraveSearch 
              graves={graves} 
              onGraveSelect={handleGraveSelect}
              onServiceOrder={handleServiceOrder}
            />
          </TabsContent>

          <TabsContent value="map">
            <CemeteryMap 
              graves={graves}
              selectedGrave={selectedGrave}
              onGraveSelect={setSelectedGrave}
            />
          </TabsContent>

          <TabsContent value="services">
            <ServiceOrder 
              selectedGrave={selectedGrave}
              onGraveSelect={setSelectedGrave}
            />
          </TabsContent>

          <TabsContent value="articles">
            <ArticlesSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="mb-4">Eternal Rest Cemetery</h3>
              <p className="text-slate-300">
                Providing compassionate care and professional services since 1950.
              </p>
            </div>
            <div>
              <h3 className="mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setContactOpen(true)}
                  className="block text-slate-300 hover:text-white transition-colors"
                >
                  Contact Us
                </button>
                <button 
                  onClick={() => setFaqOpen(true)}
                  className="block text-slate-300 hover:text-white transition-colors"
                >
                  FAQ
                </button>
                <button 
                  onClick={() => setReservationOpen(true)}
                  className="block text-slate-300 hover:text-white transition-colors"
                >
                  Make a Reservation
                </button>
                <button 
                  onClick={() => setActiveTab('articles')}
                  className="block text-slate-300 hover:text-white transition-colors"
                >
                  Articles & Resources
                </button>
              </div>
            </div>
            <div>
              <h3 className="mb-4">Contact Information</h3>
              <div className="space-y-2 text-slate-300">
                <p>123 Memorial Drive</p>
                <p>Springfield, ST 12345</p>
                <p>(555) 123-4567</p>
                <p>info@eternalrest.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Eternal Rest Cemetery. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <FAQDialog open={faqOpen} onOpenChange={setFaqOpen} />
      <ReservationDialog open={reservationOpen} onOpenChange={setReservationOpen} />
    </div>
  );
}
