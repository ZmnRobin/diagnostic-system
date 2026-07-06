# Phase 1 — Manual Smoke Test

Run these steps against a local dev environment once Postgres is running.

## Setup

```bash
# 1. Start Postgres via Docker
docker compose up -d

# 2. Migrate + seed
npm run db:migrate
npm run db:seed

# 3. Run the app
npm run dev
```

Open http://localhost:3000

---

## Test 1 — Login & role-based redirect

1. Visit `/`.
2. You are redirected to `/login`.
3. Log in as `reception` / `reception123` → redirected to `/reception`.
4. Log out via the top-right button → redirected back to `/login`.
5. Log in as `admin` / `admin123` → redirected to `/admin`.
6. Log in as `lab` / `lab123` → redirected to `/lab`.

✅ Expected: each role lands on its own dashboard. Nav shows role-appropriate items.

## Test 2 — Register a patient

1. As `reception`, click **+ New Patient**.
2. Fill: Name = "Test Patient", Mobile = "03001234567",
   Age = 30, Gender = Male.
3. Click **Register** → redirected to the patient detail page.
4. Note the generated patient code at the top (e.g. `P-2026-00001`).

✅ Expected: code format `P-YYYY-NNNNN`, padded to 5 digits.

## Test 3 — Search patient

1. From the patient detail page, click **Patients** in the top nav.
2. Type part of the name or mobile into search → list filters live.
3. Click **View** on a row → back to detail.

✅ Expected: search returns within ~300ms; matches by id/name/mobile.

## Test 4 — Test catalog (admin)

1. Log in as `admin`.
2. Go to **Tests** in the nav.
3. Click **+ Category**, type "Cardiology", **Save**.
4. Click **+ New Test**, fill code = "ECG", name = "Electrocardiogram",
   select Cardiology, price = 1500, **Save**.
5. Confirm it appears in the list, grouped under Cardiology.

✅ Expected: new test visible immediately. Reactivating already exists.

## Test 5 — Create invoice (reception)

1. As `reception`, click **+ New Invoice**.
2. In "Step 1 — Patient", type any part of the name from Test 2, click the row.
3. In "Step 2 — Tests", pick CBC and Urine R/E.
4. Subtotal = Rs. 950. Set discount = 50 → total = Rs. 900.
5. Click **Confirm & Print**.

✅ Expected: redirected to invoice page. Print dialog opens automatically.
Reload: invoice still shows the correct total. Receipt contains center name
from settings, patient info, items table, discount, total, "Cash" payment.

## Test 6 — Income recorded automatically

1. As `admin`, open **Admin Dashboard**.
2. The **Today** section shows:
   - Income = Rs. 900 from the invoice above
   - Patients = at least 1
   - Profit = 900 (no expenses yet)
3. Open **Recent activity** — the latest entry should show `PAYMENT_RECEIVED`.

✅ Expected: income reflects the invoice within ~1 second.

## Test 7 — Lab sees pending test

1. As `lab`, open the Lab Dashboard.
2. Pending tests = 2 (CBC + Urine R/E from Test 5).
3. Each row shows the patient name, test name, category, and invoice no.

> Note: result entry & approval arrive in **Phase 2**.

## Test 8 — Database integrity

Open Prisma Studio: `npm run db:studio`.

Confirm:
- 3 users exist (`admin`, `reception`, `lab`) with bcrypt hashes.
- 5+ test categories exist; the new "Cardiology" is there.
- Invoice from Test 5 has 2 line items, each linked to a `LabResult`
  with status `DRAFT`.
- `AuditLog` has entries for: USER_LOGIN (multiple), PATIENT_CREATED,
  TEST_CREATED, INVOICE_CREATED, PAYMENT_RECEIVED.

✅ Expected: every state-mutating action creates an audit entry.

---

## Verification commands

```bash
npm run typecheck    # 0 errors expected
npm run build        # clean build expected
docker compose ps    # postgres up & healthy
```

---

## Phase 1 exit criteria — recap

- [x] Auth works for all 3 roles.
- [x] Patient register / search / view works.
- [x] Test catalog admin CRUD works.
- [x] Reception can create an invoice end-to-end with patient + tests + discount.
- [x] Income auto-recorded, visible on admin dashboard.
- [x] Lab sees pending tests (result entry comes in Phase 2).
- [x] Printable invoice (HTML) works; PDF reports in Phase 2.
- [x] Audit log captures all key actions.
- [x] Seed: 3 users, 5 test categories, 10 sample tests with reference ranges.
- [x] Settings seeded: center name, address, phone.

Proceed to **Phase 2** when all tests pass.