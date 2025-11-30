#!/usr/bin/env node

/**
 * Staging Database Seed Script
 *
 * Populates staging Supabase database with test data:
 * - 5 test users
 * - 3 test trips
 * - 5 test requests
 * - 3 test matches
 * - 1 payment intent record (test-mode)
 * - 1 dispute record (mock)
 *
 * Usage: node scripts/seed-staging-data.js
 *
 * Required environment variables:
 *   STAGING_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   STAGING_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Load environment variables from .env.staging
function loadEnvFile() {
  const envFile = path.join(__dirname, "..", ".env.staging");
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, "utf-8");
    envContent.split("\n").forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts
            .join("=")
            .trim()
            .replace(/^["']|["']$/g, "");
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

const SUPABASE_URL =
  process.env.STAGING_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    `${colors.red}❌ Error: Supabase URL and Service Role Key required${colors.reset}`
  );
  console.error(
    `   Set STAGING_SUPABASE_URL and STAGING_SUPABASE_SERVICE_ROLE_KEY`
  );
  console.error(`   Or set in .env.staging file`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const insertedIds = {
  users: [],
  profiles: [],
  trips: [],
  requests: [],
  matches: [],
  conversations: [],
  messages: [],
  deliveries: [],
};

console.log(
  `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
);
console.log(`${colors.cyan}Staging Database Seed${colors.reset}`);
console.log(
  `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`
);

// Check if tables are empty (to avoid duplicates)
async function checkTableEmpty(tableName) {
  const { data, error } = await supabase.from(tableName).select("id").limit(1);

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return !data || data.length === 0;
}

// Create test users (via auth, then create user records)
async function createTestUsers() {
  console.log(`${colors.blue}Creating test users...${colors.reset}`);

  const testUsers = [
    {
      email: "test-traveler1@sparecarry.test",
      password: "Test123!@#",
      role: "traveler",
      name: "Test Traveler 1",
    },
    {
      email: "test-traveler2@sparecarry.test",
      password: "Test123!@#",
      role: "traveler",
      name: "Test Traveler 2",
    },
    {
      email: "test-requester1@sparecarry.test",
      password: "Test123!@#",
      role: "requester",
      name: "Test Requester 1",
    },
    {
      email: "test-requester2@sparecarry.test",
      password: "Test123!@#",
      role: "requester",
      name: "Test Requester 2",
    },
    {
      email: "test-sailor1@sparecarry.test",
      password: "Test123!@#",
      role: "sailor",
      name: "Test Sailor 1",
    },
  ];

  const usersEmpty = await checkTableEmpty("users");

  if (!usersEmpty) {
    console.log(
      `${colors.yellow}⚠️  Users table not empty, skipping user creation${colors.reset}`
    );
    // Fetch existing users for IDs
    const { data: existingUsers } = await supabase
      .from("users")
      .select("id, email")
      .limit(5);
    if (existingUsers) {
      insertedIds.users = existingUsers.map((u) => u.id);
    }
    return;
  }

  for (const userData of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
        });

      if (authError) {
        console.error(
          `${colors.red}❌ Failed to create auth user ${userData.email}: ${authError.message}${colors.reset}`
        );
        continue;
      }

      const userId = authData.user.id;

      // Create user record
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: userData.email,
          role: userData.role,
        })
        .select()
        .single();

      if (userError) {
        console.error(
          `${colors.red}❌ Failed to create user record: ${userError.message}${colors.reset}`
        );
        continue;
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          shipping_name: userData.name,
          shipping_city: "Test City",
          shipping_state: "CA",
          shipping_postal_code: "90210",
          shipping_country: "USA",
        })
        .select()
        .single();

      if (profileError) {
        console.error(
          `${colors.yellow}⚠️  Profile creation warning: ${profileError.message}${colors.reset}`
        );
      } else {
        insertedIds.profiles.push(profile.id);
      }

      insertedIds.users.push(userId);
      console.log(
        `${colors.green}✅ Created user: ${userData.email} (${userId})${colors.reset}`
      );
    } catch (error) {
      console.error(
        `${colors.red}❌ Error creating user ${userData.email}: ${error.message}${colors.reset}`
      );
    }
  }

  console.log(
    `\n${colors.green}✅ Created ${insertedIds.users.length} test users${colors.reset}\n`
  );
}

// Create test trips
async function createTestTrips() {
  console.log(`${colors.blue}Creating test trips...${colors.reset}`);

  if (insertedIds.users.length < 2) {
    console.log(
      `${colors.yellow}⚠️  Not enough users, skipping trips${colors.reset}\n`
    );
    return;
  }

  const tripsEmpty = await checkTableEmpty("trips");

  if (!tripsEmpty) {
    console.log(
      `${colors.yellow}⚠️  Trips table not empty, skipping trip creation${colors.reset}\n`
    );
    return;
  }

  const travelerIds = insertedIds.users.slice(0, 2); // First 2 users as travelers

  const testTrips = [
    {
      user_id: travelerIds[0],
      type: "plane",
      from_location: "San Francisco, CA",
      to_location: "St. George's, Grenada",
      flight_number: "AA1234",
      departure_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 7 days from now
      eta_window_start: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000
      ).toISOString(),
      eta_window_end: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000
      ).toISOString(),
      spare_kg: 23.0,
      spare_volume_liters: 50.0,
      max_dimensions: JSON.stringify({
        length_cm: 150,
        width_cm: 50,
        height_cm: 30,
      }),
      can_oversize: false,
      status: "active",
    },
    {
      user_id: travelerIds[1],
      type: "boat",
      from_location: "Rodney Bay, Saint Lucia",
      to_location: "Grenada Marine, Grenada",
      departure_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 14 days from now
      eta_window_start: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000
      ).toISOString(),
      eta_window_end: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000
      ).toISOString(),
      spare_kg: 45.0,
      spare_volume_liters: 100.0,
      max_dimensions: JSON.stringify({
        length_cm: 200,
        width_cm: 80,
        height_cm: 50,
      }),
      can_oversize: true,
      status: "active",
    },
    {
      user_id: travelerIds[0],
      type: "plane",
      from_location: "Miami, FL",
      to_location: "Bridgetown, Barbados",
      flight_number: "DL5678",
      departure_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 21 days from now
      eta_window_start: new Date(
        Date.now() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
      ).toISOString(),
      eta_window_end: new Date(
        Date.now() + 21 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000
      ).toISOString(),
      spare_kg: 15.0,
      spare_volume_liters: 30.0,
      max_dimensions: JSON.stringify({
        length_cm: 100,
        width_cm: 40,
        height_cm: 25,
      }),
      can_oversize: false,
      status: "active",
    },
  ];

  const { data: trips, error } = await supabase
    .from("trips")
    .insert(testTrips)
    .select();

  if (error) {
    console.error(
      `${colors.red}❌ Failed to create trips: ${error.message}${colors.reset}`
    );
    return;
  }

  insertedIds.trips = trips.map((t) => t.id);
  console.log(
    `${colors.green}✅ Created ${trips.length} test trips${colors.reset}\n`
  );
}

// Create test requests
async function createTestRequests() {
  console.log(`${colors.blue}Creating test requests...${colors.reset}`);

  if (insertedIds.users.length < 3) {
    console.log(
      `${colors.yellow}⚠️  Not enough users, skipping requests${colors.reset}\n`
    );
    return;
  }

  const requestsEmpty = await checkTableEmpty("requests");

  if (!requestsEmpty) {
    console.log(
      `${colors.yellow}⚠️  Requests table not empty, skipping request creation${colors.reset}\n`
    );
    return;
  }

  const requesterIds = insertedIds.users.slice(2, 5); // Users 3-5 as requesters

  const testRequests = [
    {
      user_id: requesterIds[0],
      title: "Marine Battery - 12V Deep Cycle",
      description:
        "Need a 12V deep cycle marine battery for my boat. Group 27 size preferred.",
      from_location: "West Marine, San Francisco, CA",
      to_location: "Grenada Marine, St. George's, Grenada",
      deadline_earliest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      deadline_latest: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      max_reward: 150.0,
      weight_kg: 25.0,
      dimensions_cm: JSON.stringify({
        length_cm: 30,
        width_cm: 17,
        height_cm: 20,
      }),
      value_usd: 250.0,
      preferred_method: "any",
      emergency: false,
      purchase_retailer: "west_marine",
      status: "open",
    },
    {
      user_id: requesterIds[1],
      title: "Boat Parts - Winch Handle",
      description:
        "Looking for a Lewmar winch handle, size 8. Any condition as long as it works.",
      from_location: "SVB, Miami, FL",
      to_location: "Rodney Bay Marina, Saint Lucia",
      deadline_earliest: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      deadline_latest: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      max_reward: 75.0,
      weight_kg: 2.0,
      dimensions_cm: JSON.stringify({
        length_cm: 40,
        width_cm: 5,
        height_cm: 5,
      }),
      value_usd: 120.0,
      preferred_method: "boat",
      emergency: false,
      purchase_retailer: "svb",
      status: "open",
    },
    {
      user_id: requesterIds[2],
      title: "Emergency: Propeller Shaft Seal",
      description:
        "URGENT: Need a prop shaft seal for Yanmar 3YM30. Part number: 128250-42590",
      from_location: "Amazon, Los Angeles, CA",
      to_location: "Bridgetown, Barbados",
      deadline_earliest: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      deadline_latest: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      max_reward: 200.0,
      weight_kg: 0.5,
      dimensions_cm: JSON.stringify({
        length_cm: 10,
        width_cm: 10,
        height_cm: 5,
      }),
      value_usd: 80.0,
      preferred_method: "plane",
      emergency: true,
      purchase_retailer: "amazon",
      status: "open",
    },
    {
      user_id: requesterIds[0],
      title: "Sailing Gear - Foul Weather Jacket",
      description:
        "Looking for a quality foul weather jacket, size Large. Mustang or Helly Hansen preferred.",
      from_location: "West Marine, San Diego, CA",
      to_location: "Grenada Marine, St. George's, Grenada",
      deadline_earliest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      deadline_latest: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      max_reward: 100.0,
      weight_kg: 1.5,
      dimensions_cm: JSON.stringify({
        length_cm: 40,
        width_cm: 30,
        height_cm: 10,
      }),
      value_usd: 300.0,
      preferred_method: "any",
      emergency: false,
      purchase_retailer: "west_marine",
      status: "open",
    },
    {
      user_id: requesterIds[1],
      title: "Electronics - VHF Radio",
      description:
        "Need a handheld VHF radio. Standard Horizon or ICOM preferred.",
      from_location: "SVB, Fort Lauderdale, FL",
      to_location: "Rodney Bay Marina, Saint Lucia",
      deadline_earliest: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      deadline_latest: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      max_reward: 125.0,
      weight_kg: 0.8,
      dimensions_cm: JSON.stringify({
        length_cm: 20,
        width_cm: 10,
        height_cm: 8,
      }),
      value_usd: 200.0,
      preferred_method: "any",
      emergency: false,
      purchase_retailer: "svb",
      status: "open",
    },
  ];

  const { data: requests, error } = await supabase
    .from("requests")
    .insert(testRequests)
    .select();

  if (error) {
    console.error(
      `${colors.red}❌ Failed to create requests: ${error.message}${colors.reset}`
    );
    return;
  }

  insertedIds.requests = requests.map((r) => r.id);
  console.log(
    `${colors.green}✅ Created ${requests.length} test requests${colors.reset}\n`
  );
}

// Create test matches
async function createTestMatches() {
  console.log(`${colors.blue}Creating test matches...${colors.reset}`);

  if (insertedIds.trips.length < 2 || insertedIds.requests.length < 3) {
    console.log(
      `${colors.yellow}⚠️  Not enough trips or requests, skipping matches${colors.reset}\n`
    );
    return;
  }

  const matchesEmpty = await checkTableEmpty("matches");

  if (!matchesEmpty) {
    console.log(
      `${colors.yellow}⚠️  Matches table not empty, skipping match creation${colors.reset}\n`
    );
    return;
  }

  const testMatches = [
    {
      trip_id: insertedIds.trips[0],
      request_id: insertedIds.requests[0],
      status: "pending",
      reward_amount: 150.0,
      platform_fee_percent: 0.15,
    },
    {
      trip_id: insertedIds.trips[1],
      request_id: insertedIds.requests[1],
      status: "chatting",
      reward_amount: 75.0,
      platform_fee_percent: 0.15,
    },
    {
      trip_id: insertedIds.trips[2],
      request_id: insertedIds.requests[2],
      status: "escrow_paid",
      reward_amount: 200.0,
      platform_fee_percent: 0.15,
      escrow_payment_intent_id: "pi_test_staging_1234567890",
    },
  ];

  const { data: matches, error } = await supabase
    .from("matches")
    .insert(testMatches)
    .select();

  if (error) {
    console.error(
      `${colors.red}❌ Failed to create matches: ${error.message}${colors.reset}`
    );
    return;
  }

  insertedIds.matches = matches.map((m) => m.id);

  // Create conversations for matches (should be automatic via trigger, but ensure they exist)
  for (const match of matches) {
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .upsert({
        match_id: match.id,
      })
      .select()
      .single();

    if (!convError && conversation) {
      insertedIds.conversations.push(conversation.id);
    }
  }

  console.log(
    `${colors.green}✅ Created ${matches.length} test matches${colors.reset}\n`
  );
}

// Create test messages
async function createTestMessages() {
  console.log(`${colors.blue}Creating test messages...${colors.reset}`);

  if (insertedIds.conversations.length === 0 || insertedIds.users.length < 2) {
    console.log(
      `${colors.yellow}⚠️  Not enough conversations or users, skipping messages${colors.reset}\n`
    );
    return;
  }

  const messagesEmpty = await checkTableEmpty("messages");

  if (!messagesEmpty) {
    console.log(
      `${colors.yellow}⚠️  Messages table not empty, skipping message creation${colors.reset}\n`
    );
    return;
  }

  // Get trip and request user IDs for each match
  const { data: matchDetails } = await supabase
    .from("matches")
    .select(
      `
      id,
      trip_id,
      request_id,
      trips!inner(user_id),
      requests!inner(user_id)
    `
    )
    .in("id", insertedIds.matches.slice(0, 2));

  if (!matchDetails || matchDetails.length === 0) {
    console.log(
      `${colors.yellow}⚠️  No match details found, skipping messages${colors.reset}\n`
    );
    return;
  }

  const testMessages = [];

  for (const match of matchDetails) {
    const tripUserId = match.trips.user_id;
    const requestUserId = match.requests.user_id;
    const conversationId = insertedIds.conversations.find((cid) =>
      matchDetails.some((m) => m.id === match.id)
    );

    if (conversationId) {
      testMessages.push(
        {
          conversation_id: conversationId,
          sender_id: tripUserId,
          content:
            "Hi! I can help with this delivery. When would be a good time to meet?",
        },
        {
          conversation_id: conversationId,
          sender_id: requestUserId,
          content: "Great! I can meet you at the airport. Does that work?",
        },
        {
          conversation_id: conversationId,
          sender_id: tripUserId,
          content: "Perfect! I'll send you my flight details.",
        }
      );
    }
  }

  if (testMessages.length > 0) {
    const { data: messages, error } = await supabase
      .from("messages")
      .insert(testMessages)
      .select();

    if (error) {
      console.error(
        `${colors.red}❌ Failed to create messages: ${error.message}${colors.reset}`
      );
    } else {
      insertedIds.messages = messages.map((m) => m.id);
      console.log(
        `${colors.green}✅ Created ${messages.length} test messages${colors.reset}\n`
      );
    }
  }
}

// Create test delivery with dispute
async function createTestDelivery() {
  console.log(
    `${colors.blue}Creating test delivery with dispute...${colors.reset}`
  );

  if (insertedIds.matches.length < 3) {
    console.log(
      `${colors.yellow}⚠️  Not enough matches, skipping delivery${colors.reset}\n`
    );
    return;
  }

  const deliveriesEmpty = await checkTableEmpty("deliveries");

  if (!deliveriesEmpty) {
    console.log(
      `${colors.yellow}⚠️  Deliveries table not empty, skipping delivery creation${colors.reset}\n`
    );
    return;
  }

  // Use the third match (escrow_paid status)
  const disputedMatchId = insertedIds.matches[2];

  const { data: delivery, error } = await supabase
    .from("deliveries")
    .insert({
      match_id: disputedMatchId,
      proof_photos: [
        "https://example.com/proof1.jpg",
        "https://example.com/proof2.jpg",
      ],
      gps_lat_long: JSON.stringify({ lat: 12.0522, lng: -61.7556 }),
      delivered_at: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(), // 2 days ago
      dispute_opened_at: new Date(
        Date.now() - 1 * 24 * 60 * 60 * 1000
      ).toISOString(), // 1 day ago
    })
    .select()
    .single();

  if (error) {
    console.error(
      `${colors.red}❌ Failed to create delivery: ${error.message}${colors.reset}`
    );
    return;
  }

  insertedIds.deliveries.push(delivery.id);

  // Update match status to disputed
  await supabase
    .from("matches")
    .update({ status: "disputed" })
    .eq("id", disputedMatchId);

  console.log(
    `${colors.green}✅ Created test delivery with dispute${colors.reset}\n`
  );
}

// Reset mode: Delete all test data
async function resetData() {
  console.log(
    `${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
  );
  console.log(
    `${colors.yellow}⚠️  RESET MODE: This will delete ALL data!${colors.reset}`
  );
  console.log(
    `${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`
  );

  // Confirmation prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question(
      `${colors.red}Are you sure you want to delete ALL data? (type 'yes' to confirm): ${colors.reset}`,
      async (answer) => {
        rl.close();
        if (answer !== "yes") {
          console.log(`${colors.yellow}Reset cancelled.${colors.reset}`);
          process.exit(0);
        }

        try {
          console.log(`\n${colors.blue}Deleting all data...${colors.reset}\n`);

          // Delete in reverse order of dependencies (cascade-safe)
          const tables = [
            "deliveries",
            "messages",
            "conversations",
            "matches",
            "requests",
            "trips",
            "ratings",
            "profiles",
            "users",
          ];

          for (const table of tables) {
            try {
              // For users, we need to delete from auth.users first
              if (table === "users") {
                // Get all user IDs
                const { data: users } = await supabase
                  .from("users")
                  .select("id");
                if (users && users.length > 0) {
                  // Delete from auth.users using admin API
                  for (const user of users) {
                    try {
                      await supabase.auth.admin.deleteUser(user.id);
                    } catch (error) {
                      console.error(
                        `${colors.yellow}⚠️  Could not delete auth user ${user.id}: ${error.message}${colors.reset}`
                      );
                    }
                  }
                }
              }

              // Delete from table (cascade will handle related records)
              const { error } = await supabase
                .from(table)
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000");
              if (error && error.code !== "PGRST116") {
                console.error(
                  `${colors.red}❌ Failed to delete from ${table}: ${error.message}${colors.reset}`
                );
              } else {
                console.log(
                  `${colors.green}✅ Deleted all records from ${table}${colors.reset}`
                );
              }
            } catch (error) {
              console.error(
                `${colors.red}❌ Error deleting from ${table}: ${error.message}${colors.reset}`
              );
            }
          }

          console.log(
            `\n${colors.green}✅ All data deleted successfully${colors.reset}\n`
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

// Main execution
async function main() {
  try {
    // Check for --reset flag
    const shouldReset = process.argv.includes("--reset");

    if (shouldReset) {
      await resetData();
      console.log(
        `${colors.blue}Re-seeding fresh test data...${colors.reset}\n`
      );
    }

    await createTestUsers();
    await createTestTrips();
    await createTestRequests();
    await createTestMatches();
    await createTestMessages();
    await createTestDelivery();

    console.log(
      `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
    );
    console.log(`${colors.green}✅ Seed completed!${colors.reset}`);
    console.log(
      `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`
    );

    console.log(`${colors.blue}Inserted IDs:${colors.reset}`);
    console.log(`  Users: ${insertedIds.users.length}`);
    console.log(`  Profiles: ${insertedIds.profiles.length}`);
    console.log(`  Trips: ${insertedIds.trips.length}`);
    console.log(`  Requests: ${insertedIds.requests.length}`);
    console.log(`  Matches: ${insertedIds.matches.length}`);
    console.log(`  Conversations: ${insertedIds.conversations.length}`);
    console.log(`  Messages: ${insertedIds.messages.length}`);
    console.log(`  Deliveries: ${insertedIds.deliveries.length}\n`);

    console.log(`${colors.blue}Test User Credentials:${colors.reset}`);
    console.log(`  Traveler 1: test-traveler1@sparecarry.test / Test123!@#`);
    console.log(`  Traveler 2: test-traveler2@sparecarry.test / Test123!@#`);
    console.log(`  Requester 1: test-requester1@sparecarry.test / Test123!@#`);
    console.log(`  Requester 2: test-requester2@sparecarry.test / Test123!@#`);
    console.log(`  Sailor 1: test-sailor1@sparecarry.test / Test123!@#\n`);
  } catch (error) {
    console.error(
      `${colors.red}❌ Seed failed: ${error.message}${colors.reset}`
    );
    console.error(error);
    process.exit(1);
  }
}

main();
