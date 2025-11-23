import { useState } from 'react';
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

  const services = [
    { id: 'cleaning', name: 'Tombstone Cleaning', price: '$150' },
    { id: 'repair', name: 'Tombstone Repair', price: '$300+' },
    { id: 'engraving', name: 'Additional Engraving', price: '$200+' },
    { id: 'restoration', name: 'Full Restoration', price: '$500+' },
    { id: 'landscaping', name: 'Plot Landscaping', price: '$100' },
  ];

  const additionalServices = [
    { id: 'flowers', name: 'Fresh Flowers Placement', price: '$50' },
    { id: 'photo', name: 'Before/After Photos', price: '$25' },
    { id: 'sealant', name: 'Protective Sealant', price: '$75' },
  ];

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
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-slate-900">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-4">
            <h3 className="text-slate-900">Service Selection</h3>
            
            <div className="space-y-2">
              <Label htmlFor="service">Primary Service *</Label>
              <Select
                value={formData.service}
                onValueChange={(value) => setFormData({ ...formData, service: value })}
                required
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Additional Services (Optional)</Label>
              {additionalServices.map(service => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={formData.additionalServices.includes(service.id)}
                    onCheckedChange={() => toggleAdditionalService(service.id)}
                  />
                  <label
                    htmlFor={service.id}
                    className="flex-1 cursor-pointer text-slate-700"
                  >
                    {service.name} - {service.price}
                  </label>
                </div>
              ))}
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

          <Button type="submit" className="w-full" disabled={!selectedGrave}>
            {selectedGrave ? 'Submit Service Request' : 'Please select a location first'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
