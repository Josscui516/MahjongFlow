export type CheckInFormField = "fullName" | "email" | "studentId" | "privacyAccepted";
export type CheckInFormValues = Readonly<{ fullName: string; email: string; studentId: string; privacyAccepted: boolean }>;

/** Only format and consent errors are local; identity/existence decisions stay server-side. */
export function checkInFormErrors(values: CheckInFormValues, studentIdRequired: boolean): Partial<Record<CheckInFormField, string>> {
  const errors: Partial<Record<CheckInFormField, string>> = {};
  if (!values.fullName.trim()) errors.fullName = "Enter your full name.";
  else if (values.fullName.trim().length > 120 || /[\u0000-\u001f\u007f]/.test(values.fullName)) errors.fullName = "Enter a valid name of up to 120 characters.";
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (values.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Enter a valid email address, such as name@example.com.";
  if (studentIdRequired && !values.studentId.trim()) errors.studentId = "Enter your student ID.";
  else if (studentIdRequired && values.studentId.trim().length > 32) errors.studentId = "Enter a student ID of up to 32 characters.";
  if (!values.privacyAccepted) errors.privacyAccepted = "Please agree to how your details will be used before registering.";
  return errors;
}
