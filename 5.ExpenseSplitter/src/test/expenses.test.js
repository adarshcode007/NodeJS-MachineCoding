import request from "supertest";
import app from "../app.js";

import {
  cleanDatabase,
  createUser,
  createGroup,
  addMember,
} from "./helpers.js";

import pool from "../config/db.js";

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe("Expense APIs", () => {
  test("creates expense with equal split", async () => {
    const adarsh = await createUser("Adarsh", "adarsh@test.com");

    const rahul = await createUser("Rahul", "rahul@test.com");

    const aman = await createUser("Aman", "aman@test.com");

    const group = await createGroup("Goa Trip");

    await addMember(group.id, adarsh.id);
    await addMember(group.id, rahul.id);
    await addMember(group.id, aman.id);

    const response = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Dinner",
        amount: 3000,
        paidBy: adarsh.id,
        splitType: "equal",
        participants: [adarsh.id, rahul.id, aman.id],
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.description).toBe("Dinner");

    expect(response.body.data.splits).toHaveLength(3);

    expect(
      response.body.data.splits.map((split) => Number(split.amount)),
    ).toEqual([1000, 1000, 1000]);
  });

  test("creates expense with exact split", async () => {
    const adarsh = await createUser("Adarsh", "adarsh@test.com");

    const rahul = await createUser("Rahul", "rahul@test.com");

    const aman = await createUser("Aman", "aman@test.com");

    const group = await createGroup("Goa Trip");

    await addMember(group.id, adarsh.id);
    await addMember(group.id, rahul.id);
    await addMember(group.id, aman.id);

    const response = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Hotel",
        amount: 5000,
        paidBy: adarsh.id,
        splitType: "exact",
        splits: [
          {
            userId: adarsh.id,
            amount: 1000,
          },
          {
            userId: rahul.id,
            amount: 1500,
          },
          {
            userId: aman.id,
            amount: 2500,
          },
        ],
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.splits).toHaveLength(3);

    expect(
      response.body.data.splits.map((split) => Number(split.amount)),
    ).toEqual([1000, 1500, 2500]);
  });

  test("handles uneven equal split correctly", async () => {
    const a = await createUser("A", "a@test.com");

    const b = await createUser("B", "b@test.com");

    const c = await createUser("C", "c@test.com");

    const group = await createGroup("Test");

    await addMember(group.id, a.id);
    await addMember(group.id, b.id);
    await addMember(group.id, c.id);

    const response = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Something",
        amount: 100,
        paidBy: a.id,
        splitType: "equal",
        participants: [a.id, b.id, c.id],
      });

    expect(response.statusCode).toBe(201);

    const amounts = response.body.data.splits.map((split) =>
      Number(split.amount),
    );

    expect(amounts).toEqual([33.33, 33.33, 33.34]);

    expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBeCloseTo(100);
  });

  test("rejects incorrect exact split total", async () => {
    const a = await createUser("A", "a@test.com");

    const b = await createUser("B", "b@test.com");

    const group = await createGroup("Test");

    await addMember(group.id, a.id);
    await addMember(group.id, b.id);

    const response = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Dinner",
        amount: 1000,
        paidBy: a.id,
        splitType: "exact",
        splits: [
          {
            userId: a.id,
            amount: 400,
          },
          {
            userId: b.id,
            amount: 400,
          },
        ],
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Split amounts must equal expense amount",
    );
  });

  test("rejects non-member payer", async () => {
    const payer = await createUser("Payer", "payer@test.com");

    const member = await createUser("Member", "member@test.com");

    const group = await createGroup("Test");

    await addMember(group.id, member.id);

    const response = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Dinner",
        amount: 1000,
        paidBy: payer.id,
        splitType: "equal",
        participants: [member.id],
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe("Payer is not a member of this group");
  });

  test("rejects non-member participant", async () => {
    const member = await createUser("Member", "member@test.com");

    const outsider = await createUser("Outsider", "outsider@test.com");

    const group = await createGroup("Test");

    await addMember(group.id, member.id);

    const response = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Dinner",
        amount: 1000,
        paidBy: member.id,
        splitType: "equal",
        participants: [member.id, outsider.id],
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  test("rejects duplicate participants", async () => {
    const a = await createUser("A", "a@test.com");

    const b = await createUser("B", "b@test.com");

    const group = await createGroup("Test");

    await addMember(group.id, a.id);
    await addMember(group.id, b.id);

    const response = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Dinner",
        amount: 1000,
        paidBy: a.id,
        splitType: "equal",
        participants: [a.id, b.id, a.id],
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Duplicate participants are not allowed",
    );
  });

  test("rejects invalid or negative expense amount", async () => {
    const a = await createUser("A", "a@test.com");

    const b = await createUser("B", "b@test.com");

    const group = await createGroup("Test");

    await addMember(group.id, a.id);
    await addMember(group.id, b.id);

    const negativeAmountResponse = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Dinner",
        amount: -100,
        paidBy: a.id,
        splitType: "equal",
        participants: [a.id, b.id],
      });

    expect(negativeAmountResponse.statusCode).toBe(400);

    const zeroAmountResponse = await request(app)
      .post(`/api/groups/${group.id}/expenses`)
      .send({
        description: "Dinner",
        amount: 0,
        paidBy: a.id,
        splitType: "equal",
        participants: [a.id, b.id],
      });

    expect(zeroAmountResponse.statusCode).toBe(400);
  });
});
