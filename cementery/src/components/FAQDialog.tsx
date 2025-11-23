import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqs = [
  {
    question: 'How do I locate a specific grave?',
    answer: 'You can use our Search tab to find graves by name. Simply enter the name of the person you\'re looking for, and the system will display their location including section, row, and plot number. You can then view their exact location on our interactive cemetery map.',
  },
  {
    question: 'What services do you offer for tombstone maintenance?',
    answer: 'We offer comprehensive tombstone services including cleaning, repair, restoration, additional engraving, and plot landscaping. We also provide optional services like fresh flower placement, protective sealant application, and before/after documentation photos.',
  },
  {
    question: 'How long does a typical tombstone cleaning take?',
    answer: 'Most standard tombstone cleaning services take 2-4 hours depending on the size and condition of the monument. We use gentle, specialized cleaning products that are safe for all types of stone materials.',
  },
  {
    question: 'What are your visiting hours?',
    answer: 'The cemetery grounds are open daily from dawn to dusk. Our administrative office is open Monday-Friday 8:00 AM - 5:00 PM and Saturday 9:00 AM - 3:00 PM. We are closed on Sundays and major holidays.',
  },
  {
    question: 'How do I make a reservation for a burial plot?',
    answer: 'You can initiate the reservation process by clicking "Make a Reservation" in the navigation menu. Our team will guide you through available plots, pricing, and paperwork. We recommend scheduling an in-person consultation to view available locations.',
  },
  {
    question: 'What materials are best for tombstones?',
    answer: 'The most common and durable materials are granite (most popular due to longevity and low maintenance), marble (classic appearance but requires more care), and bronze (often used for plaques). Granite is typically recommended for its resistance to weathering and ease of maintenance.',
  },
  {
    question: 'Can I customize a tombstone design?',
    answer: 'Yes! We offer custom engraving, laser etching, and personalized designs. You can include photographs, custom artwork, religious symbols, or unique epitaphs. Our design team will work with you to create a meaningful memorial.',
  },
  {
    question: 'How often should tombstones be cleaned?',
    answer: 'We recommend professional cleaning every 2-3 years for most tombstones. However, this can vary based on the material, location, and environmental factors. Stones in shaded areas or near trees may need more frequent cleaning.',
  },
  {
    question: 'Do you offer pre-planning services?',
    answer: 'Yes, we encourage pre-planning as it allows you to make thoughtful decisions and can ease the burden on family members. Contact our office to discuss plot selection, monument options, and payment plans.',
  },
  {
    question: 'What is your cancellation policy for scheduled services?',
    answer: 'We require at least 48 hours notice for service cancellations. Cancellations made with less notice may be subject to a fee. Weather-related cancellations initiated by our team will be rescheduled at no additional charge.',
  },
];

export function FAQDialog({ open, onOpenChange }: FAQDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Frequently Asked Questions</DialogTitle>
          <DialogDescription>
            Find answers to common questions about our cemetery services
          </DialogDescription>
        </DialogHeader>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
