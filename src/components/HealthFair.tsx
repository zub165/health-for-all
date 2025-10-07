import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Event,
  Email,
  ContactMail,
  Campaign,
  VolunteerActivism,
  Send,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { healthForAllEmailJS } from '../services/emailJSService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`health-fair-tabpanel-${index}`}
      aria-labelledby={`health-fair-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const HealthFair: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    emergencyContact: '',
    healthConditions: '',
    medications: '',
    allergies: '',
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [newsletterForm, setNewsletterForm] = useState({
    name: '',
    email: '',
    interests: '',
  });

  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    email: '',
    phone: '',
    availability: '',
    skills: '',
    interests: '',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(false);
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await healthForAllEmailJS.sendHealthFairRegistration({
        to_name: registrationForm.name,
        to_email: registrationForm.email,
        event_name: 'Health For All Community Health Fair',
        event_date: 'Saturday, March 15, 2025',
        event_location: 'Community Center, 123 Health St, Medical City',
      });

      if (result.success) {
        setSuccess(true);
        setRegistrationForm({
          name: '',
          email: '',
          phone: '',
          age: '',
          emergencyContact: '',
          healthConditions: '',
          medications: '',
          allergies: '',
        });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send registration email');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await healthForAllEmailJS.sendContactEmail({
        from_name: contactForm.name,
        from_email: contactForm.email,
        subject: contactForm.subject,
        contact_message: contactForm.message,
      });

      if (result.success) {
        setSuccess(true);
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send contact email');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await healthForAllEmailJS.sendNewsletterSignup({
        to_name: newsletterForm.name,
        to_email: newsletterForm.email,
        newsletter_type: newsletterForm.interests,
      });

      if (result.success) {
        setSuccess(true);
        setNewsletterForm({
          name: '',
          email: '',
          interests: '',
        });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send newsletter signup');
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await healthForAllEmailJS.sendVolunteerEmail({
        from_name: volunteerForm.name,
        from_email: volunteerForm.email,
        volunteer_interest: `
          Phone: ${volunteerForm.phone}
          Availability: ${volunteerForm.availability}
          Skills: ${volunteerForm.skills}
          Interests: ${volunteerForm.interests}
        `,
      });

      if (result.success) {
        setSuccess(true);
        setVolunteerForm({
          name: '',
          email: '',
          phone: '',
          availability: '',
          skills: '',
          interests: '',
        });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send volunteer application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        🏥 Health Fair 2025
      </Typography>

      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Event Registration" icon={<Event />} />
            <Tab label="Contact Us" icon={<ContactMail />} />
            <Tab label="Newsletter" icon={<Campaign />} />
            <Tab label="Volunteer" icon={<VolunteerActivism />} />
          </Tabs>
        </Box>

        {/* Event Registration Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h5" gutterBottom>
            🎉 Health Fair Registration
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Event Details:</strong><br />
            📅 Date: Saturday, March 15, 2025<br />
            🕐 Time: 9:00 AM - 3:00 PM<br />
            📍 Location: Community Center, 123 Health St, Medical City<br />
            🎁 Free health screenings, blood pressure checks, and giveaways!
          </Alert>

          <form onSubmit={handleRegistrationSubmit}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
                  required
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={registrationForm.email}
                  onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                  required
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={registrationForm.phone}
                  onChange={(e) => setRegistrationForm({...registrationForm, phone: e.target.value})}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  value={registrationForm.age}
                  onChange={(e) => setRegistrationForm({...registrationForm, age: e.target.value})}
                />
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  fullWidth
                  label="Emergency Contact"
                  value={registrationForm.emergencyContact}
                  onChange={(e) => setRegistrationForm({...registrationForm, emergencyContact: e.target.value})}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Health Conditions"
                  value={registrationForm.healthConditions}
                  onChange={(e) => setRegistrationForm({...registrationForm, healthConditions: e.target.value})}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Current Medications"
                  value={registrationForm.medications}
                  onChange={(e) => setRegistrationForm({...registrationForm, medications: e.target.value})}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Allergies"
                  value={registrationForm.allergies}
                  onChange={(e) => setRegistrationForm({...registrationForm, allergies: e.target.value})}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                disabled={loading}
                sx={{ minWidth: '200px' }}
              >
                {loading ? 'Registering...' : 'Register for Health Fair'}
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Contact Us Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h5" gutterBottom>
            📧 Contact Health For All
          </Typography>

          <form onSubmit={handleContactSubmit}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                />
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  required
                />
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  required
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                disabled={loading}
                sx={{ minWidth: '200px' }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Newsletter Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" gutterBottom>
            📰 Health Newsletter Signup
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Stay updated with health tips, upcoming events, and community health initiatives!
          </Alert>

          <form onSubmit={handleNewsletterSubmit}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={newsletterForm.name}
                  onChange={(e) => setNewsletterForm({...newsletterForm, name: e.target.value})}
                  required
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={newsletterForm.email}
                  onChange={(e) => setNewsletterForm({...newsletterForm, email: e.target.value})}
                  required
                />
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Health Interests (optional)"
                  placeholder="e.g., nutrition, exercise, mental health, chronic disease management"
                  value={newsletterForm.interests}
                  onChange={(e) => setNewsletterForm({...newsletterForm, interests: e.target.value})}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <Email />}
                disabled={loading}
                sx={{ minWidth: '200px' }}
              >
                {loading ? 'Subscribing...' : 'Subscribe to Newsletter'}
              </Button>
            </Box>
          </form>
        </TabPanel>

        {/* Volunteer Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" gutterBottom>
            🤝 Volunteer Application
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Join our team and help make a difference in community health! We need volunteers for health fairs, educational programs, and community outreach.
          </Alert>

          <form onSubmit={handleVolunteerSubmit}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={volunteerForm.name}
                  onChange={(e) => setVolunteerForm({...volunteerForm, name: e.target.value})}
                  required
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={volunteerForm.email}
                  onChange={(e) => setVolunteerForm({...volunteerForm, email: e.target.value})}
                  required
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={volunteerForm.phone}
                  onChange={(e) => setVolunteerForm({...volunteerForm, phone: e.target.value})}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Availability"
                  placeholder="e.g., Weekends, Evenings, Specific dates"
                  value={volunteerForm.availability}
                  onChange={(e) => setVolunteerForm({...volunteerForm, availability: e.target.value})}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Skills & Experience"
                  placeholder="e.g., Medical background, event planning, customer service"
                  value={volunteerForm.skills}
                  onChange={(e) => setVolunteerForm({...volunteerForm, skills: e.target.value})}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Areas of Interest"
                  placeholder="e.g., Health screenings, education, administration, fundraising"
                  value={volunteerForm.interests}
                  onChange={(e) => setVolunteerForm({...volunteerForm, interests: e.target.value})}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <VolunteerActivism />}
                disabled={loading}
                sx={{ minWidth: '200px' }}
              >
                {loading ? 'Submitting...' : 'Apply to Volunteer'}
              </Button>
            </Box>
          </form>
        </TabPanel>
      </Paper>

      {/* Status Messages */}
      {success && (
        <Alert 
          severity="success" 
          icon={<CheckCircle />}
          onClose={() => setSuccess(false)}
          sx={{ mb: 2 }}
        >
          Email sent successfully! Check your inbox for confirmation.
        </Alert>
      )}

      {error && (
        <Alert 
          severity="error" 
          icon={<Error />}
          onClose={() => setError(null)}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* EmailJS Status */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📧 EmailJS Integration Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip label="300 emails/day FREE" color="success" />
            <Chip label="No backend required" color="info" />
            <Chip label="Professional templates" color="primary" />
            <Chip label="Mobile responsive" color="secondary" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            All emails are sent directly from the frontend using EmailJS. No server configuration needed!
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default HealthFair;
