import { useState } from 'react';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Search, MapPin, Calendar, Wrench } from 'lucide-react';
import type { GraveLocation } from '../App';

interface GraveSearchProps {
  graves: GraveLocation[];
  onGraveSelect: (grave: GraveLocation) => void;
  onServiceOrder: (grave: GraveLocation) => void;
}

export function GraveSearch({ graves, onGraveSelect, onServiceOrder }: GraveSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGraves = graves.filter(grave =>
    grave.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Bar */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {filteredGraves.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <p>No results found. Please try a different search term.</p>
          </Card>
        ) : (
          filteredGraves.map(grave => (
            <Card key={grave.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-slate-900">{grave.name}</h3>
                    <div className="flex items-center gap-2 text-slate-600 mt-1">
                      <Calendar className="size-4" />
                      <span>{grave.birthDate} - {grave.deathDate}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="size-4 text-slate-500" />
                    <span>
                      Section {grave.section} • Row {grave.row} • Plot {grave.plot}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => onGraveSelect(grave)}
                    variant="default"
                    className="whitespace-nowrap"
                  >
                    <MapPin className="size-4 mr-2" />
                    View Location
                  </Button>
                  <Button
                    onClick={() => onServiceOrder(grave)}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    <Wrench className="size-4 mr-2" />
                    Order Service
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
