import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("newspaper migration enforces ownership, foreign keys, uniqueness, and author-only edits", async t => {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  const world = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const otherWorld = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const year = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const otherYear = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const fork = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  const otherFork = "ffffffff-ffff-4fff-8fff-ffffffffffff";
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      insert into auth.users values ('${owner}'), ('${other}');
    `);
    for (const migration of ["20261117042102_private_worldlines.sql", "20261117140000_worldline_newspaper.sql"]) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${migration}`, import.meta.url), "utf8"));
    }
    await db.exec(`
      insert into public.if_worlds (id, owner_id, name, description, start, rules, policy) values
        ('${world}', '${owner}', 'World one', 'A world', '2034', 'Rules', 'SOLO'),
        ('${otherWorld}', '${other}', 'World two', 'Another world', '2034', 'Rules', 'SOLO');
      insert into public.if_world_years (id, world_id, year) values ('${year}', '${world}', '2035'), ('${otherYear}', '${otherWorld}', '2035');
      insert into public.if_world_forks (id, world_id, from_year_id, name, premise) values
        ('${fork}', '${world}', '${year}', 'Branch', 'A different future'),
        ('${otherFork}', '${otherWorld}', '${otherYear}', 'Other branch', 'Another future');
      set role authenticated;
      set request.jwt.claim.sub = '${owner}';
    `);
    const insert = (worldId = world, forkId: string | null = null, yearId: string | null = null, author = owner) => db.query<{ id: string; updated_at: string }>(
      `insert into public.if_newspaper_articles (world_id, fork_id, year_id, author_id, newspaper_name, published_on, headline, body)
       values ($1, $2, $3, $4, 'The Paper', 'Year 12, First Dawn', 'News', E'First line.\nSecond line.') returning id, updated_at`,
      [worldId, forkId, yearId, author],
    );
    let originId = "";
    let originalTimestamp = "";
    await t.test("owner can create and read the main origin article", async () => {
      const saved = await insert();
      originId = saved.rows[0].id;
      originalTimestamp = saved.rows[0].updated_at;
      const articles = await db.query<{ body: string }>("select body from public.if_newspaper_articles");
      assert.equal(articles.rows[0].body, "First line.\nSecond line.");
    });
    await t.test("one article per nullable worldline/event pair; inherited events remain separate", async () => {
      await assert.rejects(insert(), { code: "23505" });
      await insert(world, fork, null);
      await insert(world, null, year);
      await insert(world, fork, year);
      await assert.rejects(insert(world, fork, null), { code: "23505" });
      await assert.rejects(insert(world, null, year), { code: "23505" });
      await assert.rejects(insert(world, fork, year), { code: "23505" });
      assert.equal((await db.query("select id from public.if_newspaper_articles")).rows.length, 4);
    });
    await t.test("author can edit content and gets a server-generated revision timestamp", async () => {
      const updated = await db.query<{ headline: string; updated_at: string }>("update public.if_newspaper_articles set headline = 'Updated' where id = $1 returning headline, updated_at", [originId]);
      assert.equal(updated.rows[0].headline, "Updated");
      assert.notEqual(updated.rows[0].updated_at, originalTimestamp);
    });
    await t.test("cross-world event/fork IDs and forged authors are rejected", async () => {
      await assert.rejects(insert(world, otherFork, null), { code: "23503" });
      await assert.rejects(insert(world, null, otherYear), { code: "23503" });
      await assert.rejects(insert(otherWorld), { code: "42501" });
      await assert.rejects(insert(world, null, null, other), { code: "42501" });
    });
    await t.test("article identity, author, and relationships cannot be changed", async () => {
      for (const field of ["world_id", "fork_id", "year_id", "author_id", "created_at", "updated_at"]) {
        await assert.rejects(db.query(`update public.if_newspaper_articles set ${field} = ${field} where id = $1`, [originId]), { code: "42501" });
      }
    });
    await t.test("another account cannot read or update the owner's newspaper", async () => {
      await db.exec(`set request.jwt.claim.sub = '${other}';`);
      assert.equal((await db.query("select id from public.if_newspaper_articles")).rows.length, 0);
      assert.equal((await db.query("update public.if_newspaper_articles set headline = 'Stolen' returning id")).rows.length, 0);
      await assert.rejects(insert(world, null, null, other), { code: "42501" });
      await db.exec(`set request.jwt.claim.sub = '${owner}';`);
      assert.equal((await db.query<{ headline: string }>("select headline from public.if_newspaper_articles where id = $1", [originId])).rows[0].headline, "Updated");
    });
    await t.test("anonymous clients cannot access newspaper storage", async () => {
      await db.exec("reset role; set role anon;");
      await assert.rejects(db.query("select * from public.if_newspaper_articles"), { code: "42501" });
    });
  } finally { await db.close(); }
});
