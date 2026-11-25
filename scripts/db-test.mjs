#!/usr/bin/env node

/**
 * Database tests that need no Docker: applies every migration in supabase/migrations
 * to an in-memory Postgres (PGlite) with a small stand-in for Supabase's auth schema
 * and roles, then checks the access rules by acting as different users.
 *
 * Run: npm run db:test
 */

import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(root, 'supabase', 'migrations');

// The parts of a Supabase database that the migrations rely on.
const SUPABASE_STAND_IN = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
  $$;

  create schema extensions;
  grant usage on schema public, auth, extensions to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  -- Like a project created with "Automatically expose new tables" turned off: new
  -- tables get no privileges until a migration grants them.
`;

const users = {
  alice: '00000000-0000-4000-8000-00000000000a', // creates listings
  bob: '00000000-0000-4000-8000-00000000000b',
  carol: '00000000-0000-4000-8000-00000000000c',
  dave: '00000000-0000-4000-8000-00000000000d', // admin
  erin: '00000000-0000-4000-8000-00000000000e', // banned
  teen: '00000000-0000-4000-8000-00000000000f', // 16 years old
  frank: '00000000-0000-4000-8000-000000000010', // lives in a city that is not supported yet
  grace: '00000000-0000-4000-8000-000000000011', // picks hobbies during onboarding
  henry: '00000000-0000-4000-8000-000000000012', // sends a wrong list of hobbies
};

// Kadriorg park, about 2 km from the centre of Tallinn.
const KADRIORG = { lat: 59.4383, lng: 24.79 };
const TALLINN = { lat: 59.437, lng: 24.7536 };
const HELSINKI = { lat: 60.1699, lng: 24.9384 };
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

function yearsAgo(years) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().slice(0, 10);
}

const db = await PGlite.create();

async function run(sql, params) {
  return (await db.query(sql, params)).rows;
}

/** Runs fn as the given user, the way the Supabase API would after sign-in. */
async function as(user, fn) {
  const claims = JSON.stringify({ sub: users[user], role: 'authenticated' });
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims]);
  await db.exec('set role authenticated');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claims', '', false)`);
  }
}

/** Runs fn as a signed-out visitor. */
async function asAnon(fn) {
  await db.exec('set role anon');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

async function fails(promise, pattern) {
  await assert.rejects(promise, (error) => {
    assert.match(error.message, pattern);
    return true;
  });
}

function insertListing(fields = {}) {
  const listing = {
    category: 'table_tennis',
    title: 'Table tennis in Kadriorg',
    starts_at: tomorrow,
    city: 'tallinn',
    place_name: 'Kadriorg park',
    lat: KADRIORG.lat,
    lng: KADRIORG.lng,
    group_min: 2,
    group_max: 3,
    ...fields,
  };
  const columns = Object.keys(listing);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  return run(
    `insert into public.listings (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`,
    Object.values(listing)
  );
}

function feed(point = TALLINN, radiusKm = 25) {
  return run('select * from public.feed_listings($1, $2, $3)', [point.lat, point.lng, radiusKm]);
}

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push(true);
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.push(false);
    console.log(`  ✗ ${name}\n      ${error.message.split('\n').join('\n      ')}`);
  }
}

// --- Set up -------------------------------------------------------------------

await db.exec(SUPABASE_STAND_IN);
for (const file of readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort()) {
  try {
    await db.exec(readFileSync(path.join(migrationsDir, file), 'utf8'));
    console.log(`applied ${file}`);
  } catch (error) {
    console.error(`✗ ${file}: ${error.message}`);
    process.exit(1);
  }
}
for (const [name, id] of Object.entries(users)) {
  await run('insert into auth.users (id, email) values ($1, $2)', [id, `${name}@example.test`]);
}

// --- Tests ----------------------------------------------------------------------

console.log('\nOnboarding and profiles');

await test('people under 18 cannot finish onboarding', () =>
  as('teen', () =>
    fails(run(`select public.complete_onboarding('Teen', $1::date)`, [yearsAgo(16)]), /must_be_adult/)
  )
);

await test('signed-out visitors cannot finish onboarding', () =>
  asAnon(() =>
    fails(run(`select public.complete_onboarding('Anon', $1::date)`, [yearsAgo(30)]), /permission denied/)
  )
);

await test('adults finish onboarding', async () => {
  for (const name of ['alice', 'bob', 'carol', 'dave', 'erin']) {
    const displayName = name[0].toUpperCase() + name.slice(1);
    await as(name, () =>
      run(`select public.complete_onboarding($1, $2::date, '{en,ru}', 'tallinn', 'en')`, [
        displayName,
        yearsAgo(30),
      ])
    );
  }
  const [{ count }] = await run('select count(*)::int as count from public.profiles');
  assert.equal(count, 5);
});

await test('people from a city that is not supported yet finish onboarding and keep it private', async () => {
  await as('frank', () =>
    run(`select public.complete_onboarding(' Frank ', $1::date, '{et}', null, 'et', '  Pärnu ')`, [
      yearsAgo(25),
    ])
  );
  const [frank] = await run(
    `select p.display_name, p.home_city, pp.requested_city
       from public.profiles p join public.profile_private pp on pp.user_id = p.id
      where p.id = $1`,
    [users.frank]
  );
  assert.deepEqual(frank, { display_name: 'Frank', home_city: null, requested_city: 'Pärnu' });
  const seenByBob = await as('bob', () =>
    run('select requested_city from public.profile_private where user_id = $1', [users.frank])
  );
  assert.equal(seenByBob.length, 0);
});

await test('a typed city is dropped when a city from the list is chosen', async () => {
  // Onboard Carol again, this time with both a city from the list and a typed one.
  await run('delete from public.profiles where id = $1', [users.carol]);
  await as('carol', () =>
    run(`select public.complete_onboarding('Carol', $1::date, '{en}', 'tallinn', 'en', 'Narva')`, [yearsAgo(30)])
  );
  const [carol] = await run('select requested_city from public.profile_private where user_id = $1', [users.carol]);
  assert.equal(carol.requested_city, null);
});

await test('hobbies are saved with the profile, each with an optional level', async () => {
  await as('grace', () =>
    run(`select public.complete_onboarding('Grace', $1::date, '{en}', 'tallinn', 'en', null, $2::jsonb)`, [
      yearsAgo(28),
      JSON.stringify([
        { category: 'tennis', skill_level: 2 },
        { category: 'chess', skill_level: 3 },
        { category: 'language_exchange' },
      ]),
    ])
  );
  const rows = await run(
    'select category, skill_level from public.user_interests where user_id = $1 order by category',
    [users.grace]
  );
  assert.deepEqual(rows, [
    { category: 'chess', skill_level: 3 },
    { category: 'language_exchange', skill_level: null },
    { category: 'tennis', skill_level: 2 },
  ]);
});

await test('a wrong list of hobbies stops onboarding and leaves nothing behind', async () => {
  const onboardHenry = (interests) =>
    as('henry', () =>
      run(`select public.complete_onboarding('Henry', $1::date, '{en}', 'tallinn', 'en', null, $2::jsonb)`, [
        yearsAgo(40),
        JSON.stringify(interests),
      ])
    );
  await fails(onboardHenry([{ category: 'skydiving' }]), /unknown_category/);
  await fails(onboardHenry([{ category: 'tennis' }, { category: 'tennis', skill_level: 1 }]), /duplicate_interest/);
  await fails(onboardHenry([{ category: 'tennis', skill_level: 4 }]), /skill_level/);
  // A hobby that has been switched off cannot be picked either.
  await run(`update public.categories set is_active = false where slug = 'football'`);
  try {
    await fails(onboardHenry([{ category: 'football' }]), /unknown_category/);
  } finally {
    await run(`update public.categories set is_active = true where slug = 'football'`);
  }
  assert.equal((await run('select id from public.profiles where id = $1', [users.henry])).length, 0);
  assert.equal((await run('select category from public.user_interests where user_id = $1', [users.henry])).length, 0);
});

await test('others see hobbies and their levels', async () => {
  const rows = await as('bob', () =>
    run('select category, skill_level from public.user_interests where user_id = $1', [users.grace])
  );
  assert.equal(rows.length, 3);
});

await test("users cannot add hobbies to someone else's profile", () =>
  as('bob', () =>
    fails(
      run(`insert into public.user_interests (user_id, category) values ($1, 'football')`, [users.grace]),
      /permission denied/
    )
  )
);

await test('people edit their profile and hobbies in one step', async () => {
  await as('grace', () =>
    run(`select public.update_profile(' Grace H. ', ' Tennis twice a week ', '{en,et}', 'tartu', null, $1::jsonb)`, [
      JSON.stringify([{ category: 'tennis', skill_level: 3 }, { category: 'running' }]),
    ])
  );
  const [grace] = await run('select display_name, bio, languages, home_city from public.profiles where id = $1', [
    users.grace,
  ]);
  assert.deepEqual(grace, {
    display_name: 'Grace H.',
    bio: 'Tennis twice a week',
    languages: ['en', 'et'],
    home_city: 'tartu',
  });
  // Chess and language exchange are gone, tennis has a new level, running is new.
  const interests = await run(
    'select category, skill_level from public.user_interests where user_id = $1 order by category',
    [users.grace]
  );
  assert.deepEqual(interests, [
    { category: 'running', skill_level: null },
    { category: 'tennis', skill_level: 3 },
  ]);
});

await test('a city that is not supported yet can be chosen in the profile', async () => {
  const save = (city, typedCity) =>
    as('grace', () =>
      run(`select public.update_profile('Grace H.', '', '{en}', $1, $2, '[]'::jsonb)`, [city, typedCity])
    );
  const cities = () =>
    run(
      `select p.home_city, pp.requested_city
         from public.profiles p join public.profile_private pp on pp.user_id = p.id
        where p.id = $1`,
      [users.grace]
    );
  await save(null, ' Narva ');
  assert.deepEqual((await cities())[0], { home_city: null, requested_city: 'Narva' });
  await save('tallinn', 'Narva');
  assert.deepEqual((await cities())[0], { home_city: 'tallinn', requested_city: null });
});

await test('a wrong list of hobbies leaves the profile as it was', async () => {
  await fails(
    as('grace', () =>
      run(`select public.update_profile('Changed', '', '{en}', 'tallinn', null, $1::jsonb)`, [
        JSON.stringify([{ category: 'skydiving' }]),
      ])
    ),
    /unknown_category/
  );
  const [grace] = await run('select display_name from public.profiles where id = $1', [users.grace]);
  assert.equal(grace.display_name, 'Grace H.');
});

await test('editing a profile changes only your own', async () => {
  await as('bob', () => run(`select public.update_profile('Bob', 'Hi', '{en,ru}', 'tallinn', null, '[]'::jsonb)`));
  const [bob] = await run('select bio from public.profiles where id = $1', [users.bob]);
  assert.equal(bob.bio, 'Hi');
  const [grace] = await run('select display_name, bio from public.profiles where id = $1', [users.grace]);
  assert.deepEqual(grace, { display_name: 'Grace H.', bio: '' });
});

await test('signed-out visitors cannot edit profiles', () =>
  asAnon(() => fails(run(`select public.update_profile('Anon')`), /permission denied/))
);

// Done by hand in the dashboard in real life.
await run('insert into public.admins (user_id) values ($1)', [users.dave]);
await run(`insert into public.user_bans (user_id, reason) values ($1, 'Spam')`, [users.erin]);

await test('a birth date cannot be changed after onboarding', () =>
  as('alice', () => fails(run(`update public.profile_private set birth_date = '2015-01-01'`), /permission denied/))
);

await test("nobody sees someone else's birth date", async () => {
  const rows = await as('bob', () => run('select user_id from public.profile_private'));
  assert.deepEqual(
    rows.map((row) => row.user_id),
    [users.bob]
  );
});

await test("users cannot edit someone else's profile", async () => {
  await as('bob', () => run(`update public.profiles set display_name = 'Hacked' where id = $1`, [users.alice]));
  const [alice] = await run('select display_name from public.profiles where id = $1', [users.alice]);
  assert.equal(alice.display_name, 'Alice');
});

await test('users cannot make themselves admins', () =>
  as('bob', () => fails(run('insert into public.admins (user_id) values ($1)', [users.bob]), /permission denied/))
);

console.log('\nListings and the feed');

let listing;

await test('a new listing waits for moderation and is hidden from others', async () => {
  [listing] = await as('alice', () => insertListing());
  assert.equal(listing.moderation_status, 'pending');
  const seenByBob = await as('bob', () => run('select id from public.listings where id = $1', [listing.id]));
  assert.equal(seenByBob.length, 0);
});

await test('authors cannot approve their own listing', () =>
  as('alice', () =>
    fails(
      run(`update public.listings set moderation_status = 'approved' where id = $1`, [listing.id]),
      /permission denied/
    )
  )
);

await test('only admins moderate', () =>
  as('bob', () =>
    fails(run(`select public.admin_moderate_listing($1, 'approved')`, [listing.id]), /not_admin/)
  )
);

await test('banned users cannot create listings', () =>
  as('erin', () => fails(insertListing(), /row-level security/))
);

await test('an approved listing shows up in the feed of people nearby', async () => {
  await as('dave', () => run(`select public.admin_moderate_listing($1, 'approved')`, [listing.id]));
  const rows = await as('bob', () => feed());
  assert.deepEqual(
    rows.map((row) => row.id),
    [listing.id]
  );
  assert.equal(rows[0].spots_left, 2);
  assert.ok(rows[0].distance_km > 1.5 && rows[0].distance_km < 2.5, `distance ${rows[0].distance_km}`);
});

await test('authors do not get their own listings in the feed', async () => {
  assert.equal((await as('alice', () => feed())).length, 0);
});

await test('listings in another city are not in the feed', async () => {
  assert.equal((await as('bob', () => feed(HELSINKI))).length, 0);
});

await test('editing a listing sends it back to moderation', async () => {
  await as('alice', () =>
    run(`update public.listings set title = 'Table tennis by the sea' where id = $1`, [listing.id])
  );
  const [row] = await run('select moderation_status from public.listings where id = $1', [listing.id]);
  assert.equal(row.moderation_status, 'pending');
  await as('dave', () => run(`select public.admin_moderate_listing($1, 'approved')`, [listing.id]));
});

console.log('\nApplications and chats');

let bobApplication;
let chatId;

await test('authors cannot apply to their own listing', () =>
  as('alice', () =>
    fails(run('insert into public.applications (listing_id) values ($1)', [listing.id]), /row-level security/)
  )
);

await test('a right swipe sends an application that the author sees', async () => {
  await as('bob', () => run(`select public.swipe_listing($1, 'right', 'Hi! I play twice a week')`, [listing.id]));
  const rows = await as('alice', () =>
    run('select id, note, status from public.applications where listing_id = $1', [listing.id])
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, 'pending');
  assert.equal(rows[0].note, 'Hi! I play twice a week');
  bobApplication = rows[0].id;
});

await test('other people do not see the application', async () => {
  assert.equal((await as('carol', () => run('select id from public.applications'))).length, 0);
});

await test('a swiped listing leaves the feed', async () => {
  assert.equal((await as('bob', () => feed())).length, 0);
});

await test('only the author accepts applicants', () =>
  as('carol', () => fails(run('select public.accept_application($1)', [bobApplication]), /not_listing_author/))
);

await test('accepting an applicant opens a chat for both', async () => {
  await as('alice', () => run('select public.accept_application($1)', [bobApplication]));
  const [chat] = await as('bob', () => run('select id from public.chats where listing_id = $1', [listing.id]));
  chatId = chat.id;
  const members = await as('bob', () =>
    run('select user_id, role from public.chat_members where chat_id = $1 order by role', [chatId])
  );
  assert.deepEqual(members, [
    { user_id: users.alice, role: 'author' },
    { user_id: users.bob, role: 'member' },
  ]);
  const [row] = await run('select accepted_count from public.listings where id = $1', [listing.id]);
  assert.equal(row.accepted_count, 1);
});

await test('a full listing takes nobody else', async () => {
  const [chess] = await as('alice', () =>
    insertListing({ category: 'chess', title: 'Chess in the old town', group_min: 2, group_max: 2 })
  );
  await as('dave', () => run(`select public.admin_moderate_listing($1, 'approved')`, [chess.id]));
  await as('bob', () => run(`select public.swipe_listing($1, 'right')`, [chess.id]));
  await as('carol', () => run(`select public.swipe_listing($1, 'right')`, [chess.id]));
  const applications = await as('alice', () =>
    run('select id, applicant_id from public.applications where listing_id = $1', [chess.id])
  );
  const byApplicant = Object.fromEntries(applications.map((row) => [row.applicant_id, row.id]));
  await as('alice', () => run('select public.accept_application($1)', [byApplicant[users.bob]]));
  await as('alice', () =>
    fails(run('select public.accept_application($1)', [byApplicant[users.carol]]), /listing_full/)
  );
});

let bobMessage;

await test('chat members talk to each other', async () => {
  [{ id: bobMessage }] = await as('bob', () =>
    run(`insert into public.messages (chat_id, body) values ($1, 'See you at six!') returning id`, [chatId])
  );
  const rows = await as('alice', () => run('select body from public.messages where chat_id = $1', [chatId]));
  assert.deepEqual(
    rows.map((row) => row.body),
    ['See you at six!']
  );
});

await test('people outside a chat neither read nor write in it', async () => {
  assert.equal(
    (await as('carol', () => run('select id from public.messages where chat_id = $1', [chatId]))).length,
    0
  );
  await as('carol', () =>
    fails(
      run(`insert into public.messages (chat_id, body) values ($1, 'Hello?')`, [chatId]),
      /row-level security/
    )
  );
});

await test('a hidden message stays visible only to its sender', async () => {
  await as('dave', () => run(`select public.admin_hide_message($1, 'Rude')`, [bobMessage]));
  assert.equal(
    (await as('alice', () => run('select id from public.messages where id = $1', [bobMessage]))).length,
    0
  );
  const [own] = await as('bob', () => run('select hidden_reason from public.messages where id = $1', [bobMessage]));
  assert.equal(own.hidden_reason, 'Rude');
});

await test('withdrawing frees the spot and leaves the chat', async () => {
  await as('bob', () => run('select public.withdraw_application($1)', [bobApplication]));
  const [row] = await run('select accepted_count from public.listings where id = $1', [listing.id]);
  assert.equal(row.accepted_count, 0);
  const members = await run('select user_id from public.chat_members where chat_id = $1', [chatId]);
  assert.deepEqual(
    members.map((member) => member.user_id),
    [users.alice]
  );
});

console.log('\nSafety');

await test('blocked people disappear from each other', async () => {
  await as('alice', () => run('insert into public.blocks (blocked_id) values ($1)', [users.carol]));
  const listingsSeenByCarol = await as('carol', () =>
    run('select id from public.listings where author_id = $1', [users.alice])
  );
  assert.equal(listingsSeenByCarol.length, 0);
  assert.equal(
    (await as('carol', () => run('select id from public.profiles where id = $1', [users.alice]))).length,
    0
  );
  assert.equal(
    (await as('alice', () => run('select id from public.profiles where id = $1', [users.carol]))).length,
    0
  );
});

await test('a report is seen only by the reporter and admins', async () => {
  await as('bob', () =>
    run(`insert into public.reports (target_listing_id, reason, details) values ($1, 'spam', 'Ads')`, [listing.id])
  );
  const [own] = await as('bob', () => run('select target_user_id, target_snapshot from public.reports'));
  assert.equal(own.target_user_id, users.alice);
  assert.equal(own.target_snapshot.type, 'listing');
  assert.equal((await as('alice', () => run('select id from public.reports'))).length, 0);
  assert.equal((await as('dave', () => run('select id from public.reports'))).length, 1);
});

await test('only admins resolve reports', async () => {
  await as('bob', () => run(`update public.reports set status = 'resolved'`));
  assert.equal((await run('select status from public.reports'))[0].status, 'open');
  await as('dave', () => run(`update public.reports set status = 'resolved', resolution_note = 'Removed'`));
  const [report] = await run('select status, resolved_by from public.reports');
  assert.equal(report.status, 'resolved');
  assert.equal(report.resolved_by, users.dave);
});

await test('beacons are private', async () => {
  await as('bob', () => run(`insert into public.beacons (category, city) values ('board_games', 'tallinn')`));
  assert.equal((await as('bob', () => run('select id from public.beacons'))).length, 1);
  assert.equal((await as('carol', () => run('select id from public.beacons'))).length, 0);
});

await test('a phone token moves to whoever signs in on that phone', async () => {
  await as('bob', () => run(`select public.register_push_token('ExponentPushToken[test]', 'android')`));
  await as('carol', () => run(`select public.register_push_token('ExponentPushToken[test]', 'android')`));
  assert.equal((await as('bob', () => run('select token from public.push_tokens'))).length, 0);
  assert.equal((await as('carol', () => run('select token from public.push_tokens'))).length, 1);
});

await test('signed-out visitors see only categories and cities', () =>
  asAnon(async () => {
    assert.equal((await run('select slug from public.categories')).length, 12);
    assert.equal((await run('select slug from public.cities')).length, 5);
    await fails(run('select id from public.profiles'), /permission denied/);
    await fails(run('select id from public.listings'), /permission denied/);
  })
);

console.log('\nServer');

await test('the server role reads and changes everything, including server-owned columns', async () => {
  await db.exec('set role service_role');
  try {
    assert.equal((await run('select count(*)::int as count from public.profiles'))[0].count, 7);
    await run(`update public.listings set moderation_status = 'rejected' where id = $1`, [listing.id]);
    await run('select private.is_admin()');
  } finally {
    await db.exec('reset role');
  }
});

await test('the API schema holds only the security definer functions the app calls', async () => {
  // Helpers used by the access rules live in the private schema, which the Data API does not expose.
  const rows = await run(`
    select p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef and p.prorettype <> 'trigger'::regtype
     order by p.proname`);
  assert.deepEqual(
    rows.map((row) => row.proname),
    [
      'accept_application',
      'admin_ban_user',
      'admin_hide_message',
      'admin_moderate_listing',
      'admin_unban_user',
      'complete_onboarding',
      'decline_application',
      'register_push_token',
      'withdraw_application',
    ]
  );
});

console.log('\nConsistency with the app');

await test('categories match src/constants/categories.ts', async () => {
  const source = readFileSync(path.join(root, 'src', 'constants', 'categories.ts'), 'utf8');
  const inApp = [...source.matchAll(/slug: '([a-z_]+)', group: \{ min: (\d+), max: (\d+) \}/g)].map(
    ([, slug, min, max]) => `${slug} ${min}-${max}`
  );
  const inDatabase = (await run('select slug, min_group, max_group from public.categories order by sort_order')).map(
    (row) => `${row.slug} ${row.min_group}-${row.max_group}`
  );
  assert.ok(inApp.length > 0, 'no categories found in categories.ts');
  assert.deepEqual(inDatabase, inApp);
});

await test('cities match src/constants/cities.ts', async () => {
  const source = readFileSync(path.join(root, 'src', 'constants', 'cities.ts'), 'utf8');
  const inApp = [...source.matchAll(/slug: '([a-z_]+)', country: '([A-Z]{2})'/g)].map(
    ([, slug, country]) => `${slug} ${country}`
  );
  const inDatabase = (await run('select slug, country_code from public.cities order by sort_order')).map(
    (row) => `${row.slug} ${row.country_code}`
  );
  assert.ok(inApp.length > 0, 'no cities found in cities.ts');
  assert.deepEqual(inDatabase, inApp);
});

// --- Summary --------------------------------------------------------------------

const failed = results.filter((passed) => !passed).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
