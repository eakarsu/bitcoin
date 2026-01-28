import { Typography, Card, CardContent, Button, Chip, Box } from '@mui/material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Careers() {
  const positions = [
    { title: 'Senior AI Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
    { title: 'Full Stack Developer', department: 'Engineering', location: 'New York', type: 'Full-time' },
    { title: 'Product Manager', department: 'Product', location: 'Remote', type: 'Full-time' },
    { title: 'UI/UX Designer', department: 'Design', location: 'Remote', type: 'Contract' },
  ];

  return (
    <PageTemplate title="Careers" subtitle="Join our team and shape the future of trading">
      <Typography variant="body1" paragraph>
        We're building the most advanced AI-powered trading platform in the world. Join our team of passionate
        engineers, designers, and trading experts who are pushing the boundaries of what's possible.
      </Typography>

      <Typography variant="h5" fontWeight="bold" sx={{ mt: 6, mb: 3 }}>
        Open Positions
      </Typography>

      {positions.map((position, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {position.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={position.department} size="small" />
                  <Chip label={position.location} size="small" variant="outlined" />
                  <Chip label={position.type} size="small" color="primary" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  We're looking for talented individuals to join our {position.department.toLowerCase()} team.
                </Typography>
              </Box>
              <Button variant="contained">Apply Now</Button>
            </Box>
          </CardContent>
        </Card>
      ))}

      <Typography variant="h5" fontWeight="bold" sx={{ mt: 6, mb: 3 }}>
        Why Work With Us
      </Typography>
      <ul>
        <li><Typography>Competitive salary and equity packages</Typography></li>
        <li><Typography>Remote-first culture</Typography></li>
        <li><Typography>Unlimited PTO</Typography></li>
        <li><Typography>Health, dental, and vision insurance</Typography></li>
        <li><Typography>Learning and development budget</Typography></li>
        <li><Typography>Latest equipment and tools</Typography></li>
      </ul>
    </PageTemplate>
  );
}
