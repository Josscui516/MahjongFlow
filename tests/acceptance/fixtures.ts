export const FICTIONAL_ACCEPTANCE_FIXTURES = Object.freeze({
  committee: Object.freeze({
    userId: "a1111111-1111-4111-8111-111111111111",
    email: "m1-committee@example.test",
    role: "committee" as const,
  }),
  authorised: Object.freeze({
    userId: "a2222222-2222-4222-8222-222222222222",
    email: "m1-authorised@example.test",
    role: "authorised" as const,
  }),
  noProfile: Object.freeze({
    userId: "a3333333-3333-4333-8333-333333333333",
    email: "m1-no-profile@example.test",
  }),
  anonymous: Object.freeze({ role: "anon" as const }),
});
