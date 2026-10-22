import { expect, it } from "vitest";
import { checkInFormErrors } from "./form-validation";
const valid = { fullName:"Fictional Attendee", email:"attendee@example.test", studentId:"", privacyAccepted:true };
it("accepts the minimal name/email/consent form without requiring a retired student ID",()=>{
  expect(checkInFormErrors(valid,false)).toEqual({});
});
it("returns field-specific errors for empty fields and missing consent",()=>{
  expect(Object.keys(checkInFormErrors({fullName:" ",email:"",studentId:"",privacyAccepted:false},false))).toEqual(["fullName","email","privacyAccepted"]);
});
it("catches invalid email syntax, long names and conditional student IDs",()=>{
  expect(checkInFormErrors({...valid,email:"bad@address",fullName:"x".repeat(121)},false)).toHaveProperty("email");
  expect(checkInFormErrors({...valid,email:"bad@address",fullName:"x".repeat(121)},false)).toHaveProperty("fullName");
  expect(checkInFormErrors(valid,true)).toHaveProperty("studentId");
});
it("validates only format and never exposes whether an identity already exists",()=>{
  expect(checkInFormErrors({...valid,email:"unknown@example.test"},false)).toEqual({});
});
