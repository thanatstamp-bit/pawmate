-- 017_demo_reset.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Daily auto-reset for the SHARED demo login (demo@pawmate.app).
--
-- WHY: testers all sign in through the "ลองเล่นโหมด Demo" button using one shared
-- account, so their swipes / matches / chats / care-hub posts pile up and the
-- account turns into a mess. Because every row belongs to the same demo user,
-- tester data is indistinguishable from the intended demo data at the row level —
-- so the only reliable reset is "wipe everything this account owns, then re-seed
-- a known-good showcase". This mirrors scripts/seed-demo.ts (the full-option demo)
-- but targets demo@pawmate.app and runs server-side on a pg_cron schedule.
--
-- WHAT IT TOUCHES: only two accounts — demo@pawmate.app and its dedicated
-- counterpart bot demo-deck@pawmate.internal (owns the matched / deck / donor
-- pets so chats look real and deck candidates appear). The general 85-pet swipe
-- pool (owned by the ephemeral seed-bot) and every real user account are NEVER
-- touched.
--
-- SETUP (run once, in the Supabase SQL Editor):
--   1. Enable pg_cron: Dashboard → Database → Extensions → search "pg_cron" → enable
--      (or it is created below if your project allows `create extension`).
--   2. Paste-and-run this whole file. It installs the function, ensures the
--      counterpart bot exists, schedules the daily job, and runs one reset now.
--   demo@pawmate.app itself must already exist (it is the DEMO_EMAIL login) — this
--   script never creates or re-passwords it, so the Demo button keeps working.
--
-- SCHEDULE: daily at 19:00 UTC (= 02:00 Asia/Bangkok, low traffic). Change the
-- cron expression at the bottom if you want a different time.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pgcrypto with schema extensions;

-- ── The reset routine ────────────────────────────────────────────────────────
create or replace function public.reset_demo_account()
returns void
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  demo_id    uuid;
  friends_id uuid;
  -- demo's own pets
  mochi uuid; noon uuid;
  -- counterpart pets
  v_max uuid; lady uuid; luna uuid; bella uuid; cocco uuid; tiger uuid; spam uuid;
  -- matches
  match_max uuid; match_lady uuid; match_luna uuid;
  -- care-hub rows
  lost1 uuid; req1 uuid;
  spot_a uuid; spot_b uuid;
begin
  -- 1. Resolve the shared demo login. If it does not exist, do nothing.
  select id into demo_id from auth.users where email = 'demo@pawmate.app';
  if demo_id is null then
    raise notice 'demo@pawmate.app not found — nothing to reset';
    return;
  end if;

  -- 2. Ensure the dedicated counterpart bot exists (never logs in; owns the
  --    match / deck / donor pets). Created once; a no-op on later runs.
  select id into friends_id from auth.users where email = 'demo-deck@pawmate.internal';
  if friends_id is null then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'demo-deck@pawmate.internal',
      crypt('demo-deck-not-used', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(),
      '', '', '', ''
    )
    returning id into friends_id;
  end if;

  -- 3. Canonical profile rows (display_name is NOT NULL).
  insert into public.profiles (id, display_name) values (demo_id, 'เจ้าของน้องเดโม่')
    on conflict (id) do update set display_name = excluded.display_name;
  insert into public.profiles (id, display_name) values (friends_id, 'เพื่อนน้องเดโม่')
    on conflict (id) do update set display_name = excluded.display_name;

  -- 4. Wipe. Deleting pets cascades to likes / matches / messages / reviews /
  --    reports / blocks / playdate_proposals / health_records / blood_donors /
  --    blood_responses. These three key off the profile directly → delete them.
  delete from public.pets          where owner_id in (demo_id, friends_id);
  delete from public.lost_pets     where reporter_id = demo_id;
  delete from public.blood_requests where requester_id = demo_id;
  delete from public.vet_bookings  where user_id = demo_id;

  -- 5. Demo's own pets (2 → multi-pet + active-pet switching).
  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (demo_id, 'เจ้าโมจิ', 'dog', 'โกลเด้น รีทรีฟเวอร์', 'male', '2022-03-01',
    array['https://placedog.net/400/500?r=11','https://placedog.net/400/500?r=12'],
    array['ขี้เล่น','ใจดี','ฉลาด','เข้ากับเด็กได้'], 'กรุงเทพมหานคร', null,
    array['playdate','breeding'], true, false,
    'เจ้าโมจิเป็นโกลเด้นสุดน่ารัก ขี้เล่นและเป็นมิตรกับทุกคน ชอบวิ่งเล่นในสวนและว่ายน้ำ 🐶')
  returning id into mochi;

  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (demo_id, 'น้องนุ่น', 'cat', 'สก็อตติช โฟลด์', 'female', '2023-06-01',
    array['https://cataas.com/cat?width=400&height=500&seed=21','https://cataas.com/cat?width=400&height=500&seed=22'],
    array['ขี้อ้อน','ชอบนอน','ใจดี'], 'กรุงเทพมหานคร', null,
    array['playdate'], true, true,
    'น้องนุ่นเป็นแมวหูพับขี้อ้อน ชอบนอนตักและกอด อ้อนเก่งมาก 🐱')
  returning id into noon;

  -- 6. Counterpart pets (owned by the bot).
  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (friends_id, 'เจ้าแม็กซ์', 'dog', 'บีเกิ้ล', 'male', '2021-08-01',
    array['https://placedog.net/400/500?r=31','https://placedog.net/400/500?r=32'],
    array['พลังเยอะ','ขี้เล่น','ชอบเดินเล่น'], 'กรุงเทพมหานคร', null,
    array['playdate'], true, true, 'เจ้าแม็กซ์พลังเยอะมาก ชอบวิ่งเล่นตอนเช้า')
  returning id into v_max;

  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (friends_id, 'เลดี้', 'dog', 'โกลเด้น รีทรีฟเวอร์', 'female', '2021-11-01',
    array['https://placedog.net/400/500?r=33','https://placedog.net/400/500?r=34'],
    array['ใจดี','เชื่อฟัง','ขี้อ้อน'], 'กรุงเทพมหานคร', null,
    array['playdate','breeding'], true, false, 'เลดี้เป็นโกลเด้นสาวนิสัยดี เรียบร้อย รักเด็ก')
  returning id into lady;

  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (friends_id, 'ลูน่า', 'cat', 'เปอร์เซีย', 'female', '2022-05-01',
    array['https://cataas.com/cat?width=400&height=500&seed=35','https://cataas.com/cat?width=400&height=500&seed=36'],
    array['ขี้อ้อน','ชอบนอน'], 'กรุงเทพมหานคร', null,
    array['playdate'], true, true, 'ลูน่าเป็นแมวเปอร์เซียขนฟู ชอบนอนกลางวัน')
  returning id into luna;

  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (friends_id, 'เบลล่า', 'dog', 'โกลเด้น รีทรีฟเวอร์', 'female', '2022-01-01',
    array['https://placedog.net/400/500?r=37','https://placedog.net/400/500?r=38'],
    array['ขี้เล่น','พลังเยอะ'], 'นนทบุรี', null,
    array['playdate','breeding'], true, false, 'เบลล่าโกลเด้นสาวร่าเริง มองหาเพื่อนเล่นและคู่ที่ใช่')
  returning id into bella;

  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (friends_id, 'ค็อกโก้', 'dog', 'คอร์กี้', 'female', '2023-02-01',
    array['https://placedog.net/400/500?r=39','https://placedog.net/400/500?r=40'],
    array['ขี้อ้อน','ซุกซน'], 'กรุงเทพมหานคร', null,
    array['playdate'], true, false, 'ค็อกโก้คอร์กี้ขาสั้นน่ารัก ชอบหาเพื่อนเดินเล่น')
  returning id into cocco;

  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (friends_id, 'ไทเกอร์', 'dog', 'ลาบราดอร์ รีทรีฟเวอร์', 'male', '2020-04-01',
    array['https://placedog.net/400/500?r=41','https://placedog.net/400/500?r=42'],
    array['ใจดี','เชื่อฟัง'], 'กรุงเทพมหานคร', null,
    array['playdate'], true, true, 'ไทเกอร์ลาบราดอร์ตัวใหญ่ใจดี พร้อมเป็นผู้ให้เลือด')
  returning id into tiger;

  insert into public.pets (owner_id, name, species, breed, sex, birth_month, photos,
    personality_tags, province, district, modes, vaccinated, neutered, bio)
  values (friends_id, 'บัญชีแปลก', 'dog', 'มิกซ์ (ลูกผสม)', 'male', '2021-01-01',
    array['https://placedog.net/400/500?r=43','https://placedog.net/400/500?r=44'],
    array['ดุกับแปลกหน้า'], 'ชลบุรี', null,
    array['playdate'], false, false, 'โปรไฟล์ที่ถูกรายงาน')
  returning id into spam;

  -- 7. Likes — deck pre-likes (→ เจ้าโมจิ, instant match on swipe-right) + history.
  insert into public.likes (from_pet_id, to_pet_id, mode) values
    (bella, mochi, 'breeding'),
    (cocco, mochi, 'playdate'),
    (mochi, v_max, 'playdate'),   -- เจ้าโมจิ already swiped (won't reappear)
    (mochi, lady, 'breeding');

  -- 8. Matches + chat history (sort uuids: matches_unique has no ordering check,
  --    app convention stores LEAST/GREATEST).
  insert into public.likes (from_pet_id, to_pet_id, mode) values (v_max, mochi, 'playdate');
  insert into public.matches (pet_a_id, pet_b_id, mode)
    values (least(mochi, v_max), greatest(mochi, v_max), 'playdate')
    returning id into match_max;
  insert into public.messages (match_id, sender_pet_id, content, created_at) values
    (match_max, v_max, 'สวัสดีครับ เจ้าโมจิน่ารักมากเลย! 🐶',        now() - interval '3 days' + interval '0 min'),
    (match_max, mochi, 'ขอบคุณครับ เจ้าแม็กซ์ก็หล่อมากเลย',          now() - interval '3 days' + interval '7 min'),
    (match_max, v_max, 'ว่างไปวิ่งเล่นที่สวนกันไหมครับ?',            now() - interval '3 days' + interval '14 min'),
    (match_max, mochi, 'ได้เลยครับ เสาร์นี้สะดวกไหม?',               now() - interval '3 days' + interval '21 min'),
    (match_max, v_max, 'สะดวกครับ เจอกันที่สวนวชิรเบญจทัศ 9 โมงนะ',  now() - interval '3 days' + interval '28 min'),
    (match_max, mochi, 'โอเคครับ แล้วเจอกัน! 🎾',                   now() - interval '3 days' + interval '35 min');

  insert into public.likes (from_pet_id, to_pet_id, mode) values (lady, mochi, 'breeding');
  insert into public.matches (pet_a_id, pet_b_id, mode)
    values (least(mochi, lady), greatest(mochi, lady), 'breeding')
    returning id into match_lady;
  insert into public.messages (match_id, sender_pet_id, content, created_at) values
    (match_lady, lady,  'สวัสดีค่ะ เลดี้เป็นโกลเด้นเหมือนกันเลย',      now() - interval '2 days' + interval '0 min'),
    (match_lady, mochi, 'ว้าว ดีจังเลยครับ สายพันธุ์เดียวกัน',         now() - interval '2 days' + interval '7 min'),
    (match_lady, lady,  'โมจิฉีดวัคซีนครบไหมคะ?',                     now() - interval '2 days' + interval '14 min'),
    (match_lady, mochi, 'ครบแล้วครับ มีสมุดสุขภาพด้วย',                now() - interval '2 days' + interval '21 min'),
    (match_lady, lady,  'เยี่ยมเลยค่ะ นัดเจอกันคุยรายละเอียดดีไหม',    now() - interval '2 days' + interval '28 min');

  insert into public.likes (from_pet_id, to_pet_id, mode) values
    (luna, noon, 'playdate'), (noon, luna, 'playdate');
  insert into public.matches (pet_a_id, pet_b_id, mode)
    values (least(noon, luna), greatest(noon, luna), 'playdate')
    returning id into match_luna;
  insert into public.messages (match_id, sender_pet_id, content, created_at) values
    (match_luna, luna, 'เมี้ยว~ น้องนุ่นหูพับน่ารักจัง 🐱',  now() - interval '1 days' + interval '0 min'),
    (match_luna, noon, 'ลูน่าขนฟูน่ากอดมากเลยค่า',           now() - interval '1 days' + interval '7 min'),
    (match_luna, luna, 'มา playdate ที่ cat cafe กันไหม',     now() - interval '1 days' + interval '14 min'),
    (match_luna, noon, 'ชอบบบ ไปกันน้า',                      now() - interval '1 days' + interval '21 min');

  -- 9. Playdate proposals (reuse two real spots if seeded; else custom_location).
  select id into spot_a from public.playdate_spots order by created_at limit 1;
  select id into spot_b from public.playdate_spots order by created_at offset 1 limit 1;
  insert into public.playdate_proposals
    (match_id, proposer_pet_id, proposed_at, spot_id, custom_location, note, status)
  values
    (match_max, v_max, now() + interval '3 days', spot_a,
     case when spot_a is null then 'สวนวชิรเบญจทัศ (สวนรถไฟ)' else null end,
     'เจอกันหน้าทางเข้าฝั่งสวนสุนัขนะครับ', 'accepted'),
    (match_lady, lady, now() + interval '6 days', spot_b,
     case when spot_b is null then 'Bark & Brew Pet Cafe ทองหล่อ' else null end,
     'นัดคุยเรื่องผสมพันธุ์ค่ะ', 'pending');

  -- 10. Reviews (both sides of the เจ้าแม็กซ์ match).
  insert into public.reviews (match_id, reviewer_pet_id, reviewed_pet_id, rating, tags, comment) values
    (match_max, v_max, mochi, 5, array['ตรงเวลา','เป็นมิตร','น้องน่ารัก'],
     'เจ้าโมจิน่ารักและเล่นด้วยสนุกมาก เจ้าของก็ใจดีมากครับ'),
    (match_max, mochi, v_max, 5, array['ตรงเวลา','ขี้เล่น'],
     'เจ้าแม็กซ์พลังเยอะ เล่นกันสนุกมาก นัดเจอง่าย');

  -- 11. Trust: block + report the spam pet.
  insert into public.blocks (blocker_pet_id, blocked_pet_id) values (mochi, spam);
  insert into public.reports (reporter_pet_id, reported_pet_id, reason, details) values
    (mochi, spam, 'โปรไฟล์ปลอม / สแปม',
     'ส่งข้อความโฆษณาขายของซ้ำ ๆ ไม่เกี่ยวกับสัตว์เลี้ยง');

  -- 12. Health records (relative dates so "ใกล้ถึงกำหนด" + rabies badge stay fresh).
  insert into public.health_records (pet_id, type, title, record_date, next_due_date, notes) values
    (mochi, 'vaccine', 'วัคซีนพิษสุนัขบ้า', current_date - 90,  current_date + 275, 'เข็มประจำปี ที่ รพ.สัตว์ทองหล่อ'),
    (mochi, 'vaccine', 'วัคซีนรวม 5 โรค',   current_date - 360, current_date + 5,   'ใกล้ครบกำหนดเข็มถัดไป'),
    (mochi, 'deworm',  'ถ่ายพยาธิ',          current_date - 30,  current_date + 60,  'ยาถ่ายพยาธิแบบเม็ด'),
    (mochi, 'checkup', 'ตรวจสุขภาพประจำปี',  current_date - 14,  null,               'สุขภาพแข็งแรงดี น้ำหนัก 28 กก.'),
    (noon,  'vaccine', 'วัคซีนพิษสุนัขบ้า', current_date - 120, current_date + 245, null),
    (noon,  'checkup', 'ตรวจสุขภาพ + ทำหมัน', current_date - 200, null,             'ทำหมันเรียบร้อย พักฟื้นดี');

  -- 13. Lost pets + sightings.
  insert into public.lost_pets (reporter_id, pet_name, species, breed, photos,
    last_seen_province, last_seen_district, last_seen_detail, lost_date,
    distinguishing_marks, contact, reward, status)
  values (demo_id, 'เจ้าข้าวตัง', 'dog', 'ชิบะ อินุ',
    array['https://placedog.net/400/500?r=61','https://placedog.net/400/500?r=62'],
    'กรุงเทพมหานคร', 'จตุจักร', 'หลุดจากบ้านแถวตลาดนัดจตุจักร ช่วงเย็น', current_date - 3,
    'ขนสีน้ำตาลทอง ใส่ปลอกคอสีแดง มีจุดขาวที่อก', '08x-xxx-xxxx',
    'มีรางวัลสำหรับผู้พบเห็น 3,000 บาท', 'lost')
  returning id into lost1;

  insert into public.lost_pets (reporter_id, pet_name, species, breed, photos,
    last_seen_province, last_seen_district, last_seen_detail, lost_date,
    distinguishing_marks, contact, reward, status)
  values (demo_id, 'น้องส้ม', 'cat', 'ส้มลายสลิด',
    array['https://cataas.com/cat?width=400&height=500&seed=63','https://cataas.com/cat?width=400&height=500&seed=64'],
    'กรุงเทพมหานคร', 'ห้วยขวาง', 'พบกลับบ้านแล้ว ขอบคุณทุกคนที่ช่วยตามหา 🙏', current_date - 12,
    'แมวส้มลาย หางยาว', '08x-xxx-xxxx', null, 'found');

  insert into public.lost_pet_sightings (lost_pet_id, reporter_id, detail, seen_at_location) values
    (lost1, friends_id, 'เห็นน้องวิ่งแถวสวนรถไฟเมื่อเช้านี้ค่ะ ดูตกใจ ๆ', 'สวนวชิรเบญจทัศ ฝั่งประตู 2'),
    (lost1, friends_id, 'เมื่อวานเห็นหมาหน้าตาคล้ายกันแถวตลาด อ.ต.ก.', 'ตลาด อ.ต.ก. จตุจักร');

  -- 14. Blood donation — donors, requests, responses.
  insert into public.blood_donors (pet_id, blood_type, weight_kg, eligible, available, last_donation_date) values
    (mochi, 'DEA 1.1 Pos', 28, true, true, current_date - 120),
    (tiger, 'DEA 1.1 Neg', 32, true, true, null),
    (v_max, 'DEA 1.1 Pos', 14, true, true, current_date - 200);

  insert into public.blood_requests (requester_id, species, blood_type_needed, urgency,
    hospital_name, province, details, contact, status)
  values (demo_id, 'dog', 'DEA 1.1 Neg', 'urgent', 'โรงพยาบาลสัตว์ทองหล่อ', 'กรุงเทพมหานคร',
    'สุนัขประสบอุบัติเหตุ ต้องการเลือดด่วนภายใน 24 ชม.', '08x-xxx-xxxx', 'open')
  returning id into req1;

  insert into public.blood_requests (requester_id, species, blood_type_needed, urgency,
    hospital_name, province, details, contact, status)
  values (demo_id, 'cat', 'A', 'normal', 'โรงพยาบาลสัตว์เกษตร', 'กรุงเทพมหานคร',
    'ต้องการเลือดสำหรับแมวผ่าตัด นัดล่วงหน้าได้', '08x-xxx-xxxx', 'fulfilled');

  insert into public.blood_responses (request_id, donor_pet_id, message) values
    (req1, tiger, 'ไทเกอร์พร้อมบริจาคครับ เลือดตรงกลุ่มพอดี ติดต่อกลับได้เลย'),
    (req1, v_max, 'ยินดีช่วยครับ สะดวกพรุ่งนี้เช้า');

  -- 15. Vet bookings (status CHECK allows only 'upcoming' | 'cancelled').
  insert into public.vet_bookings (user_id, vet_id, slot_time, topic, status) values
    (demo_id, 'vet-002', now() + interval '3 hours', 'ปรึกษาเรื่องอาหารและโภชนาการของเจ้าโมจิ', 'upcoming'),
    (demo_id, 'vet-005', now() + interval '2 days',  'ตรวจติดตามอาการเบื้องต้น',               'upcoming'),
    (demo_id, 'vet-001', now() + interval '1 days',  'สอบถามเรื่องวัคซีน',                     'cancelled'),
    (demo_id, 'vet-003', now() - interval '4 days',  'ปรึกษาอาการผิวหนังของน้องนุ่น',          'upcoming');

  raise notice 'demo@pawmate.app reset complete';
end;
$$;

-- ── Schedule it: every day at 19:00 UTC (= 02:00 Asia/Bangkok) ────────────────
-- Unschedule first so re-running this file does not stack duplicate jobs.
do $$
begin
  perform cron.unschedule('reset-demo-account-daily');
exception when others then
  null; -- job did not exist yet
end $$;

select cron.schedule(
  'reset-demo-account-daily',
  '0 19 * * *',
  $cron$ select public.reset_demo_account(); $cron$
);

-- ── Run one reset immediately so the account is clean right now ───────────────
select public.reset_demo_account();
