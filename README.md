# Health for All Fair - React Application

A comprehensive healthcare application for managing patient registrations, health screenings, and medical recommendations during health fairs.

## Features

### Patient Registration
- Complete patient information collection
- Medical history tracking
- Allergy and medication management
- Family history documentation

### Doctor Dashboard
- Patient management and search
- Comprehensive vitals recording
- Health screening tools
- Recommendation generation

### Health Screening
- Blood sugar monitoring
- Carotid doppler results
- Mental health assessment (PHQ-9)
- Automated scoring and interpretation

### Email Recommendations
- Automated email delivery
- Personalized health recommendations
- Professional medical advice templates

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI)
- **Form Management**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **Backend Integration**: Django REST API (Port 3015)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Django backend server running on port 3015

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd health-for-all
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

### Backend Setup

Ensure your Django backend server is running on port 3015 with the following API endpoints:

- `POST /api/patients/` - Create patient
- `GET /api/patients/` - List all patients
- `GET /api/patients/{id}/` - Get patient by ID
- `POST /api/vitals/` - Record vitals
- `GET /api/vitals/patient/{id}/` - Get patient vitals
- `POST /api/recommendations/` - Create recommendation
- `POST /api/recommendations/{id}/send-email/` - Send email

## Deployment

### GitHub Pages Deployment

1. Update the homepage URL in `package.json`:
```json
"homepage": "https://yourusername.github.io/health-for-all"
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

### Environment Configuration

For production deployment, update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

## Usage

### Patient Registration
1. Navigate to the home page
2. Click "Patient Registration"
3. Fill out the comprehensive registration form
4. Submit to register the patient

### Doctor Access
1. Click "Doctor Login" from the home page
2. Enter doctor credentials (demo mode accepts any valid email)
3. Access the doctor dashboard to:
   - View all registered patients
   - Record patient vitals
   - Conduct health screenings
   - Send recommendations

### Health Screening Process
1. Select a patient from the dashboard
2. Record physical vitals (blood sugar, carotid doppler)
3. Complete mental health assessment (PHQ-9)
4. Generate and send personalized recommendations

## API Integration

The application integrates with a Django backend server. Key API endpoints include:

- **Patient Management**: Full CRUD operations for patient records
- **Vitals Tracking**: Recording and retrieving health measurements
- **Recommendations**: Creating and emailing health advice
- **Email Service**: Automated delivery of recommendations

## Security Considerations

- Patient data is handled securely through HTTPS
- Form validation prevents invalid data submission
- Error handling provides user-friendly feedback
- Network errors are gracefully managed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.