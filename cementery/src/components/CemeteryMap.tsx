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
  const sections = ['A', 'B'];
  const gridSize = { rows: 4, cols: 6 };

  const getGraveAtPosition = (section: string, row: number, col: number) => {
    return graves.find(
      g => g.section === section && g.coordinates.x === row && g.coordinates.y === col
    );
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
        
        return (
          <Card key={section} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1">
                  Section {section}
                </Badge>
                <span className="text-slate-600">
                  {sectionGraves.length} plots occupied
                </span>
              </div>

              <Separator />

              {/* Grid */}
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))` }}>
                    {/* Column Headers */}
                    <div className="text-center text-slate-500 py-2">Row</div>
                    {Array.from({ length: gridSize.cols - 1 }, (_, i) => (
                      <div key={i} className="text-center text-slate-500 py-2">
                        Plot {i + 1}
                      </div>
                    ))}

                    {/* Grid Rows */}
                    {Array.from({ length: gridSize.rows - 1 }, (_, rowIdx) => (
                      <>
                        {/* Row Label */}
                        <div key={`label-${rowIdx}`} className="flex items-center justify-center text-slate-500">
                          {rowIdx + 1}
                        </div>
                        
                        {/* Grid Cells */}
                        {Array.from({ length: gridSize.cols - 1 }, (_, colIdx) => {
                          const grave = getGraveAtPosition(section, rowIdx, colIdx);
                          const isSelected = selectedGrave?.id === grave?.id;
                          
                          return (
                            <button
                              key={`${rowIdx}-${colIdx}`}
                              onClick={() => grave && onGraveSelect(grave)}
                              className={`
                                h-20 rounded border-2 transition-all
                                ${grave
                                  ? isSelected
                                    ? 'bg-blue-600 border-blue-700 hover:bg-blue-700'
                                    : 'bg-slate-600 border-slate-700 hover:bg-slate-700 hover:scale-105'
                                  : 'bg-slate-200 border-slate-300 cursor-default'
                                }
                              `}
                              disabled={!grave}
                              title={grave ? grave.name : 'Available'}
                            >
                              {grave && (
                                <div className="text-white text-center px-2">
                                  <div className="text-xs truncate">{grave.name}</div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Selected Grave Details */}
      {selectedGrave && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <h3 className="text-blue-900">Selected Location</h3>
            <div className="grid md:grid-cols-2 gap-4 text-slate-700">
              <div>
                <span className="text-slate-600">Name:</span> {selectedGrave.name}
              </div>
              <div>
                <span className="text-slate-600">Section:</span> {selectedGrave.section}
              </div>
              <div>
                <span className="text-slate-600">Row:</span> {selectedGrave.row}
              </div>
              <div>
                <span className="text-slate-600">Plot:</span> {selectedGrave.plot}
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-600">Dates:</span> {selectedGrave.birthDate} - {selectedGrave.deathDate}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
