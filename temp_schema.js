const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  age: yup.number().min(1).max(120).required('Age is required'),
  gender: yup.string().required('Gender is required'),
  bloodGroup: yup.string().required('Blood group is required'),
  pastMedicalHistory: yup.string(),
  allergies: yup.string(),
  familyHistory: yup.string(),
  medicationList: yup.string(),
});
