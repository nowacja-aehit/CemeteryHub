import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import type { GraveLocation } from '../App';

interface CemeteryMapProps {
  graves: GraveLocation[];
  selectedGrave: GraveLocation | null;
  onGraveSelect: (grave: GraveLocation | null) => void;
}

export function CemeteryMap({ graves, selectedGrave, onGraveSelect }: CemeteryMapProps) {
  const sections = [...new Set(graves.map(g => g.section))].sort();

  const getGraveAtPosition = (section: string, row: number, col: number) => {
    return graves.find(
      g => g.section === section && g.coordinates.x === row && g.coordinates.y === col
    );
  };

  const getMaxCoordinates = (section: string) => {
    const sectionGraves = graves.filter(g => g.section === section);
    if (sectionGraves.length === 0) return { rows: 0, cols: 0 };
    
    const maxRow = Math.max(...sectionGraves.map(g => g.coordinates.x));
    const maxCol = Math.max(...sectionGraves.map(g => g.coordinates.y));
    
    return { rows: maxRow + 1, cols: maxCol + 1 };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Legend */}
      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 border-2 border-slate-300 rounded" />
              <span className="text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-600 border-2 border-slate-700 rounded" />
              <span className="text-slate-600">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 border-2 border-blue-700 rounded" />
              <span className="text-slate-600">Selected</span>
            </div>
          </div>
          {selectedGrave && (
            <Button variant="outline" onClick={() => onGraveSelect(null)}>
              Clear Selection
            </Button>
          )}
        </div>
      </Card>

      {/* Cemetery Sections */}
      {sections.map(section => {
        const sectionGraves = graves.filter(g => g.section === section);
        const { rows, cols } = getMaxCoordinates(section);

        if (rows === 0 || cols === 0) {
          return (
            <Card key={section} className="p-6">
              <p className="text-slate-500">Brak danych o grobach w sekcji {section}.</p>
            </Card>
          );
        }

        return (
          <Card key={section} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1">
                  Sekcja {section}
                </Badge>
                <span className="text-slate-600">
                  {sectionGraves.length} zajętych działek
                </span>
              </div>
              <Separator />
              <div className="overflow-x-auto">
                <div 
                  className="grid gap-2" 
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(80px, 1fr))` }}
                >
                  {Array.from({ length: rows * cols }, (_, i) => {
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    const grave = getGraveAtPosition(section, row, col);
                    const isSelected = selectedGrave?.id === grave?.id;

                    return (
                      <button
                        key={`${section}-${row}-${col}`}
                        onClick={() => grave && onGraveSelect(grave)}
                        disabled={!grave}
                        className={`
                          h-20 rounded border-2 transition-all flex items-center justify-center font-bold
                          ${grave
                            ? isSelected
                              ? 'bg-blue-600 border-blue-700 text-white shadow-lg scale-105'
                              : 'bg-slate-600 border-slate-700 text-white hover:bg-slate-700'
                            : 'bg-slate-200 border-slate-300 cursor-not-allowed'
                          }
                        `}
                        title={grave ? `Grób ${section}${row + 1}${col + 1}` : 'Miejsce wolne'}
                      >
                        {grave ? `${section}${row + 1}${col + 1}` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
