import { useState } from 'react';
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

export const graveData: GraveLocation[] = [
  { id: '1', name: 'John Anderson', birthDate: '1945-03-12', deathDate: '2018-07-22', section: 'A', row: 1, plot: 3, coordinates: { x: 0, y: 2 } },
  { id: '2', name: 'Mary Thompson', birthDate: '1952-08-15', deathDate: '2020-11-30', section: 'A', row: 1, plot: 5, coordinates: { x: 0, y: 4 } },
  { id: '3', name: 'Robert Williams', birthDate: '1938-01-20', deathDate: '2019-05-14', section: 'A', row: 2, plot: 2, coordinates: { x: 1, y: 1 } },
  { id: '4', name: 'Elizabeth Davis', birthDate: '1960-11-03', deathDate: '2021-03-08', section: 'A', row: 2, plot: 4, coordinates: { x: 1, y: 3 } },
  { id: '5', name: 'James Miller', birthDate: '1942-06-25', deathDate: '2017-12-19', section: 'A', row: 3, plot: 1, coordinates: { x: 2, y: 0 } },
  { id: '6', name: 'Patricia Brown', birthDate: '1955-09-08', deathDate: '2022-01-15', section: 'A', row: 3, plot: 3, coordinates: { x: 2, y: 2 } },
  { id: '7', name: 'Michael Johnson', birthDate: '1948-04-17', deathDate: '2019-08-22', section: 'B', row: 1, plot: 2, coordinates: { x: 0, y: 1 } },
  { id: '8', name: 'Linda Wilson', birthDate: '1963-12-30', deathDate: '2023-06-11', section: 'B', row: 1, plot: 4, coordinates: { x: 0, y: 3 } },
  { id: '9', name: 'David Martinez', birthDate: '1940-02-14', deathDate: '2018-10-05', section: 'B', row: 2, plot: 1, coordinates: { x: 1, y: 0 } },
  { id: '10', name: 'Barbara Garcia', birthDate: '1958-07-21', deathDate: '2021-09-28', section: 'B', row: 2, plot: 5, coordinates: { x: 1, y: 4 } },
  { id: '11', name: 'Richard Rodriguez', birthDate: '1935-05-09', deathDate: '2016-04-13', section: 'B', row: 3, plot: 2, coordinates: { x: 2, y: 1 } },
  { id: '12', name: 'Susan Lee', birthDate: '1961-10-28', deathDate: '2022-07-30', section: 'B', row: 3, plot: 4, coordinates: { x: 2, y: 3 } },
];

export default function App() {
  const [selectedGrave, setSelectedGrave] = useState<GraveLocation | null>(null);
  const [activeTab, setActiveTab] = useState('search');
  const [contactOpen, setContactOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);

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
              graves={graveData} 
              onGraveSelect={handleGraveSelect}
              onServiceOrder={handleServiceOrder}
            />
          </TabsContent>

          <TabsContent value="map">
            <CemeteryMap 
              graves={graveData}
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
