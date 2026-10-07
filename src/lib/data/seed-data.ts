import { LegacyCustomer, Schema } from "@/lib/types/migration";

export const SOURCE_SCHEMA: Schema = {
  table_name: "legacy_customers",
  fields: [
    { name: "legacy_customer_id", type: "number", required: true, nullable: false },
    { name: "full_name", type: "string", required: true, nullable: false },
    { name: "email_address", type: "string", required: true, nullable: false },
    { name: "phone", type: "string", required: false, nullable: true },
    { name: "customer_status", type: "string", required: true, nullable: false },
    { name: "signup_date", type: "string", required: true, nullable: false },
    { name: "city", type: "string", required: false, nullable: true },
    { name: "country_code", type: "string", required: true, nullable: false },
    { name: "marketing_opt_in", type: "string", required: false, nullable: true },
    { name: "credit_limit", type: "string", required: false, nullable: true },
  ],
};

export const TARGET_SCHEMA: Schema = {
  table_name: "customer_master",
  fields: [
    { name: "id", type: "number", required: true, nullable: false },
    { name: "first_name", type: "string", required: true, nullable: false },
    { name: "last_name", type: "string", required: true, nullable: false },
    { name: "email", type: "string", required: true, nullable: false },
    { name: "phone_number", type: "string", required: false, nullable: true },
    { name: "active", type: "boolean", required: true, nullable: false },
    { name: "registered_at", type: "date", required: true, nullable: false },
    { name: "city", type: "string", required: false, nullable: true },
    { name: "country_code", type: "string", required: true, nullable: false },
    { name: "marketing_opt_in", type: "boolean", required: true, nullable: false },
    { name: "credit_limit", type: "decimal", required: true, nullable: false },
  ],
};

export const SEED_RECORDS: LegacyCustomer[] = [
  // Valid records
  {
    legacy_customer_id: 1,
    full_name: "John Smith",
    email_address: "john.smith@example.com",
    phone: "+1-555-0101",
    customer_status: "active",
    signup_date: "2022-01-15",
    city: "New York",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "5000.00",
  },
  {
    legacy_customer_id: 2,
    full_name: "Jane Doe",
    email_address: "jane.doe@example.com",
    phone: "+1-555-0102",
    customer_status: "verified",
    signup_date: "2022-02-20",
    city: "Los Angeles",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "10000.00",
  },
  {
    legacy_customer_id: 3,
    full_name: "Robert Johnson",
    email_address: "robert.j@example.com",
    phone: null,
    customer_status: "active",
    signup_date: "2021-12-10",
    city: "Chicago",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "7500.50",
  },
  {
    legacy_customer_id: 4,
    full_name: "Sarah Williams",
    email_address: "sarah.w@example.com",
    phone: "+1-555-0104",
    customer_status: "active",
    signup_date: "2023-03-05",
    city: "Houston",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "3000.00",
  },
  {
    legacy_customer_id: 5,
    full_name: "Michael Brown",
    email_address: "michael.brown@example.com",
    phone: "+1-555-0105",
    customer_status: "verified",
    signup_date: "2021-11-22",
    city: "Phoenix",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "15000.00",
  },
  // Valid records continued
  {
    legacy_customer_id: 6,
    full_name: "Emily Davis",
    email_address: "emily.davis@example.com",
    phone: "+1-555-0106",
    customer_status: "active",
    signup_date: "2023-01-10",
    city: "Philadelphia",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "4500.00",
  },
  {
    legacy_customer_id: 7,
    full_name: "David Miller",
    email_address: "david.miller@example.com",
    phone: null,
    customer_status: "approved",
    signup_date: "2022-06-15",
    city: "San Antonio",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "8000.00",
  },
  {
    legacy_customer_id: 8,
    full_name: "Lisa Anderson",
    email_address: "lisa.anderson@example.com",
    phone: "+1-555-0108",
    customer_status: "active",
    signup_date: "2023-04-20",
    city: "San Diego",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "6000.00",
  },
  {
    legacy_customer_id: 9,
    full_name: "James Taylor",
    email_address: "james.taylor@example.com",
    phone: "+1-555-0109",
    customer_status: "verified",
    signup_date: "2021-09-30",
    city: "Dallas",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "12000.00",
  },
  {
    legacy_customer_id: 10,
    full_name: "Patricia Martinez",
    email_address: "patricia.m@example.com",
    phone: "+1-555-0110",
    customer_status: "active",
    signup_date: "2022-08-08",
    city: "Austin",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "5500.00",
  },

  // Invalid records (for quarantine demo)

  // Missing full_name
  {
    legacy_customer_id: 11,
    full_name: "", // INVALID
    email_address: "invalid1@example.com",
    phone: "+1-555-0111",
    customer_status: "active",
    signup_date: "2023-05-01",
    city: "Denver",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "2000.00",
  },

  // Invalid email
  {
    legacy_customer_id: 12,
    full_name: "Invalid Email",
    email_address: "not-an-email", // INVALID
    phone: "+1-555-0112",
    customer_status: "active",
    signup_date: "2023-05-02",
    city: "Seattle",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "4000.00",
  },

  // Empty email
  {
    legacy_customer_id: 13,
    full_name: "Empty Email",
    email_address: "", // INVALID
    phone: "+1-555-0113",
    customer_status: "active",
    signup_date: "2023-05-03",
    city: "Boston",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "3500.00",
  },

  // Invalid date
  {
    legacy_customer_id: 14,
    full_name: "Invalid Date",
    email_address: "invalid.date@example.com",
    phone: "+1-555-0114",
    customer_status: "active",
    signup_date: "2026-99-44", // INVALID
    city: "Miami",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "2500.00",
  },

  // Missing country_code
  {
    legacy_customer_id: 15,
    full_name: "Missing Country",
    email_address: "no.country@example.com",
    phone: "+1-555-0115",
    customer_status: "active",
    signup_date: "2023-05-05",
    city: "Atlanta",
    country_code: "", // INVALID - required field
    marketing_opt_in: "yes",
    credit_limit: "4500.00",
  },

  // Invalid marketing_opt_in (won't convert to boolean cleanly)
  {
    legacy_customer_id: 16,
    full_name: "Invalid Opt In",
    email_address: "invalid.optin@example.com",
    phone: "+1-555-0116",
    customer_status: "active",
    signup_date: "2023-05-06",
    city: "Portland",
    country_code: "US",
    marketing_opt_in: "maybe", // INVALID
    credit_limit: "3000.00",
  },

  // Invalid credit_limit
  {
    legacy_customer_id: 17,
    full_name: "Invalid Credit",
    email_address: "invalid.credit@example.com",
    phone: "+1-555-0117",
    customer_status: "active",
    signup_date: "2023-05-07",
    city: "Las Vegas",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "not-a-number", // INVALID
  },

  // Single name (will fail split)
  {
    legacy_customer_id: 18,
    full_name: "Moonbear", // INVALID - no last name
    email_address: "moonbear@example.com",
    phone: "+1-555-0118",
    customer_status: "active",
    signup_date: "2023-05-08",
    city: "Portland",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "1500.00",
  },

  // Valid records (back to valid)
  {
    legacy_customer_id: 19,
    full_name: "Daniel Garcia",
    email_address: "daniel.garcia@example.com",
    phone: "+1-555-0119",
    customer_status: "active",
    signup_date: "2022-07-12",
    city: "Minneapolis",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "6500.00",
  },

  {
    legacy_customer_id: 20,
    full_name: "Jennifer Wilson",
    email_address: "jennifer.w@example.com",
    phone: null,
    customer_status: "verified",
    signup_date: "2021-10-05",
    city: "Nashville",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "9000.00",
  },

  // Duplicate email (for data quality check)
  {
    legacy_customer_id: 21,
    full_name: "Duplicate Email",
    email_address: "john.smith@example.com", // Same as record 1
    phone: "+1-555-0121",
    customer_status: "active",
    signup_date: "2023-05-10",
    city: "Memphis",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "2000.00",
  },

  {
    legacy_customer_id: 22,
    full_name: "Kevin Martinez",
    email_address: "kevin.martinez@example.com",
    phone: "+1-555-0122",
    customer_status: "active",
    signup_date: "2023-02-14",
    city: "Boston",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "5000.00",
  },

  {
    legacy_customer_id: 23,
    full_name: "Nancy Jackson",
    email_address: "nancy.jackson@example.com",
    phone: null,
    customer_status: "pending", // Will map to false for active
    signup_date: "2023-03-20",
    city: "Louisville",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "3500.00",
  },

  {
    legacy_customer_id: 24,
    full_name: "Christopher White",
    email_address: "christopher.white@example.com",
    phone: "+1-555-0124",
    customer_status: "active",
    signup_date: "2022-09-25",
    city: "Milwaukee",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "11000.00",
  },

  {
    legacy_customer_id: 25,
    full_name: "Mary Harris",
    email_address: "mary.harris@example.com",
    phone: "+1-555-0125",
    customer_status: "verified",
    signup_date: "2021-08-18",
    city: "Albuquerque",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "7000.00",
  },

  {
    legacy_customer_id: 26,
    full_name: "Steven Thomas",
    email_address: "steven.thomas@example.com",
    phone: "+1-555-0126",
    customer_status: "active",
    signup_date: "2023-04-02",
    city: "Tucson",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "4200.00",
  },

  {
    legacy_customer_id: 27,
    full_name: "Sandra Robinson",
    email_address: "sandra.robinson@example.com",
    phone: null,
    customer_status: "active",
    signup_date: "2022-05-30",
    city: "Fresno",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "2800.00",
  },

  {
    legacy_customer_id: 28,
    full_name: "Paul Clark",
    email_address: "paul.clark@example.com",
    phone: "+1-555-0128",
    customer_status: "verified",
    signup_date: "2021-07-22",
    city: "Sacramento",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "13000.00",
  },

  {
    legacy_customer_id: 29,
    full_name: "Karen Rodriguez",
    email_address: "karen.rodriguez@example.com",
    phone: "+1-555-0129",
    customer_status: "active",
    signup_date: "2023-03-15",
    city: "Kansas City",
    country_code: "US",
    marketing_opt_in: "yes",
    credit_limit: "5500.00",
  },

  {
    legacy_customer_id: 30,
    full_name: "Mark Lewis",
    email_address: "mark.lewis@example.com",
    phone: "+1-555-0130",
    customer_status: "active",
    signup_date: "2022-10-11",
    city: "Long Beach",
    country_code: "US",
    marketing_opt_in: "no",
    credit_limit: "8500.00",
  },
];
