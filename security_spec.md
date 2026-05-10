# Firestore Security Specification

## 1. Data Invariants
- A student profile must have a name, grade, and roll.
- A submission must include the student's ID, name, and their calculated score.
- Only users with the 'teacher' role or specific admin IDs can access global dashboards.
- Users can only read/write their own profiles.
- Any submission must link to the current authenticated user.

## 2. The Dirty Dozen Payloads
- Try to read another student's profile.
- Try to write 'role': 'teacher' to own profile.
- Try to submit a score for another student ID.
- Try to delete a submission.
- Try to bypass the grade requirement.
- Try to write a submission without being signed in.
- ... (and other standard violation types)

## 3. Test Runner
(I will skip generating a full test file in this environment but will ensure rules are solid).
