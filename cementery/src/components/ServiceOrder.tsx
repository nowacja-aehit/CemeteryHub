import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, Wrench } from 'lucide-react';
import type { GraveLocation } from '../App';

interface Service {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface ServiceCategory {
  id: number;
  name: string;
  parent_id: string | null;
}

interface ServiceOrderProps {
  selectedGrave: GraveLocation | null;
  onGraveSelect: (grave: GraveLocation | null) => void;
}

export function ServiceOrder({ selectedGrave, onGraveSelect }: ServiceOrderProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    additionalServices: [] as string[],
    date: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/categories')
        ]);
        const servicesData = await servicesRes.json();
        const categoriesData = await categoriesRes.json();
        setServices(servicesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch services data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const primaryServices = services.filter(s => {
    const category = categories.find(c => c.name === s.category);
    return category?.parent_id === 'Usługi podstawowe';
  });

  const additionalServices = services.filter(s => {
    const category = categories.find(c => c.name === s.category);
    return category?.parent_id === 'Usługi dodatkowe';
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        additionalServices: [],
        date: '',
        notes: '',
      });
      onGraveSelect(null);
    }, 3000);
  };

  const toggleAdditionalService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(serviceId)
        ? prev.additionalServices.filter(s => s !== serviceId)
        : [...prev.additionalServices, serviceId]
    }));
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <p>Ładowanie usług...</p>
      </Card>
    );
  }
  
  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="size-5 text-green-600" />
          <AlertDescription className="text-green-800 ml-2">
            Your service request has been submitted successfully. We will contact you within 24 hours to confirm the appointment.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wrench className="size-6 text-slate-600" />
          <div>
            <h2 className="text-slate-900">Order Tombstone Services</h2>
            <p className="text-slate-600">Professional maintenance and restoration services</p>
          </div>
        </div>

        {selectedGrave && (
          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <div className="text-slate-900">
              Selected Location: {selectedGrave.name}
            </div>
            <div className="text-slate-600">
              Section {selectedGrave.section} • Row {selectedGrave.row} • Plot {selectedGrave.plot}
            </div>
            <Button
              variant="link"
              onClick={() => onGraveSelect(null)}
              className="px-0 h-auto mt-2"
            >
              Change location
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grave Selection Info */}
          {!selectedGrave ? (
            <Alert variant="destructive">
              <AlertDescription>
                Please select a grave from the map first to order a service.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {/* Primary Service Selection */}
              <div>
                <Label htmlFor="service">Wybierz usługę podstawową</Label>
                <Select
                  name="service"
                  value={formData.service}
                  onValueChange={value => setFormData(prev => ({ ...prev, service: value }))}
                  required
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Wybierz usługę..." />
                  </SelectTrigger>
                  <SelectContent>
                    {primaryServices.map(service => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name} - {service.price} PLN
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Services */}
              <div>
                <Label>Wybierz usługi dodatkowe (opcjonalnie)</Label>
                <div className="space-y-2 mt-2">
                  {additionalServices.map(service => (
                    <div key={service.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`add-${service.id}`}
                        checked={formData.additionalServices.includes(service.name)}
                        onCheckedChange={() => toggleAdditionalService(service.name)}
                      />
                      <Label htmlFor={`add-${service.id}`} className="font-normal">
                        {service.name} - {service.price} PLN
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Preferred Service Date *</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requests or concerns..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={!selectedGrave}>
            {selectedGrave ? 'Submit Service Request' : 'Please select a location first'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
