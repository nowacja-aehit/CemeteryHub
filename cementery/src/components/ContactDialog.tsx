import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useState } from 'react';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    alert('Thank you for contacting us. We will respond within 24 hours.');
    onOpenChange(false);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Get in touch with our team for any inquiries or assistance
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-slate-900">Our Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-slate-600 mt-0.5" />
                <div>
                  <div className="text-slate-900">Address</div>
                  <p className="text-slate-600">
                    123 Memorial Drive<br />
                    Springfield, ST 12345
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="size-5 text-slate-600 mt-0.5" />
                <div>
                  <div className="text-slate-900">Phone</div>
                  <p className="text-slate-600">(555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="size-5 text-slate-600 mt-0.5" />
                <div>
                  <div className="text-slate-900">Email</div>
                  <p className="text-slate-600">info@eternalrest.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="size-5 text-slate-600 mt-0.5" />
                <div>
                  <div className="text-slate-900">Office Hours</div>
                  <p className="text-slate-600">
                    Monday - Friday: 8:00 AM - 5:00 PM<br />
                    Saturday: 9:00 AM - 3:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-slate-900">Send a Message</h3>
            
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email *</Label>
              <Input
                id="contact-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we help you?"
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
