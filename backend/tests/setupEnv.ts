process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_for_jest_only";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
process.env.BOT_INGEST_TOKEN = process.env.BOT_INGEST_TOKEN || "test_bot_ingest_token";
process.env.BOT_REPORT_USER_ID = process.env.BOT_REPORT_USER_ID || "111111111111111111111111";
process.env.WHATSAPP_BOT_ENABLED = "false";
