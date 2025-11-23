import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { useState } from 'react';

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservationDialog({ open, onOpenChange }: ReservationDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    section: '',
    plotType: '',
    consultation: false,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    alert('Thank you for your reservation request. Our team will contact you within 24 hours to schedule a consultation.');
    onOpenChange(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      section: '',
      plotType: '',
      consultation: false,
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make a Reservation</DialogTitle>
          <DialogDescription>
            Reserve a burial plot or schedule a consultation with our team
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-slate-900">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="res-name">Full Name *</Label>
              <Input
                id="res-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="res-email">Email *</Label>
                <Input
                  id="res-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="res-phone">Phone *</Label>
                <Input
                  id="res-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Plot Preferences */}
          <div className="space-y-4">
            <h3 className="text-slate-900">Plot Preferences</h3>
            
            <div className="space-y-2">
              <Label htmlFor="res-section">Preferred Section</Label>
              <Select
                value={formData.section}
                onValueChange={(value) => setFormData({ ...formData, section: value })}
              >
                <SelectTrigger id="res-section">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Section A - Garden View</SelectItem>
                  <SelectItem value="b">Section B - Memorial Grove</SelectItem>
                  <SelectItem value="c">Section C - Lakeside (Premium)</SelectItem>
                  <SelectItem value="d">Section D - Veterans Memorial</SelectItem>
                  <SelectItem value="any">No Preference</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-plot-type">Plot Type *</Label>
              <Select
                value={formData.plotType}
                onValueChange={(value) => setFormData({ ...formData, plotType: value })}
                required
              >
                <SelectTrigger id="res-plot-type">
                  <SelectValue placeholder="Select plot type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Plot</SelectItem>
                  <SelectItem value="companion">Companion Plot (2 person)</SelectItem>
                  <SelectItem value="family">Family Plot (4-6 person)</SelectItem>
                  <SelectItem value="cremation">Cremation Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="res-consultation"
                checked={formData.consultation}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, consultation: checked as boolean })
                }
              />
              <label
                htmlFor="res-consultation"
                className="cursor-pointer text-slate-700"
              >
                I would like to schedule an in-person consultation
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-notes">Additional Information</Label>
              <Textarea
                id="res-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any specific requirements or questions..."
                rows={4}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-slate-600 text-sm">
              * A member of our team will contact you within 24 hours to discuss availability, 
              pricing, and next steps. Pre-planning consultations are always free.
            </p>
          </div>

          <Button type="submit" className="w-full">
            Submit Reservation Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
