-- QA ONLY. Never execute against production.
-- Replace the placeholder hash with: node -e "import('bcrypt').then(b=>b.hash('ThrowawayPass1!',10).then(console.log))"
INSERT INTO users (username, email, password_hash, role, verification_status, verified_at)
VALUES (
  'admin-qa', 'admin-qa@nflquizcentral.local',
  '$2b$10$REPLACE_WITH_BCRYPT_HASH_OF_THROWAWAY_PASSWORD',
  'admin', 'verified', CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO educator_keys (key_code, created_by, max_uses)
VALUES ('QA-TEACH-2026', (SELECT id FROM users WHERE email = 'admin-qa@nflquizcentral.local'), 50)
ON CONFLICT (key_code) DO NOTHING;
