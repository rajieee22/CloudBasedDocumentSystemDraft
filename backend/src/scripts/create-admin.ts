
import { input, password } from "@inquirer/prompts";
import argon2 from "argon2";
import { pool } from "../config/database.js";

async function createAdmin() {
  const email = (
    await input({
      message: "Administrator email:",
      validate: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
        "Enter a valid email address."
    })
  ).trim().toLowerCase();

  const firstName = (
    await input({
      message: "First name:",
      validate: (value) =>
        value.trim().length > 0 || "First name is required."
    })
  ).trim();

  const middleName = (
    await input({
      message: "Middle name (optional):"
    })
  ).trim() || null;

  const lastName = (
    await input({
      message: "Last name:",
      validate: (value) =>
        value.trim().length > 0 || "Last name is required."
    })
  ).trim();

  const adminPassword = await password({
    message: "Administrator password:",
    mask: "*",
    validate: (value) =>
      value.length >= 12 ||
      "Password must contain at least 12 characters."
  });

  const confirmation = await password({
    message: "Confirm administrator password:",
    mask: "*",
    validate: (value) =>
      value === adminPassword || "Passwords do not match."
  });

  if (confirmation !== adminPassword) {
    throw new Error("Password confirmation failed.");
  }

  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingAccount = await client.query(
      `SELECT 1 FROM app_users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (existingAccount.rowCount && existingAccount.rowCount > 0) {
      throw new Error("An account with this email already exists.");
    }

    const roleResult = await client.query(
      `SELECT role_id FROM roles WHERE role_code = 'ADMIN'`
    );

    if (roleResult.rowCount !== 1) {
      throw new Error(
        "ADMIN role was not found. Check the roles table."
      );
    }

    const accountResult = await client.query(
      `
      INSERT INTO app_users (
        email,
        password_hash,
        first_name,
        middle_name,
        last_name,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING user_id
      `,
      [
        email,
        passwordHash,
        firstName,
        middleName,
        lastName
      ]
    );

    const userId = accountResult.rows[0].user_id;
    const roleId = roleResult.rows[0].role_id;

    await client.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      `,
      [userId, roleId]
    );

    await client.query("COMMIT");

    console.log("\nAdministrator account created successfully.");
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log("Assigned role: ADMIN");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await createAdmin();
} catch (error) {
  console.error(
    "\nAdministrator creation failed:",
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}
