import { Typography, Card, CardContent, Accordion, AccordionSummary, AccordionDetails, Button, Box } from '@mui/material';
import { ExpandMore, HelpOutline } from '@mui/icons-material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Support() {
  const faqs = [
    {
      question: 'How do I get started with Trading Platform?',
      answer: 'Simply sign up for an account, choose your plan, and start exploring our AI-powered trading tools. We recommend starting with our tutorials to learn the basics.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and cryptocurrency payments including BTC, ETH, and USDT.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use bank-level encryption and security measures to protect your data. All sensitive information is encrypted both in transit and at rest.'
    },
    {
      question: 'Can I try before I buy?',
      answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required.'
    },
    {
      question: 'Do you offer API access?',
      answer: 'Yes, all paid plans include API access. You can integrate our trading signals and AI insights into your own applications.'
    },
  ];

  return (
    <PageTemplate title="Support Center" subtitle="Find answers to your questions">
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Frequently Asked Questions
      </Typography>

      {faqs.map((faq, index) => (
        <Accordion key={index}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HelpOutline sx={{ mr: 2, color: 'primary.main' }} />
              <Typography fontWeight="bold">{faq.question}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary">{faq.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      <Card sx={{ mt: 6, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Still need help?
          </Typography>
          <Typography variant="body2" paragraph>
            Our support team is available 24/7 to assist you with any questions or issues.
          </Typography>
          <Button variant="contained" sx={{ bgcolor: 'white', color: 'primary.main' }}>
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
