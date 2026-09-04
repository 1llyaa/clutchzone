-- New lawyer-supplied VOP / GDPR / cookie documents replaced the previous ones
-- (see src/content/legal/*.cs.ts, all stamped version '2026-09-03').
--
-- terms_version is copied onto every booking and credit order at the moment of
-- purchase, so it has to name the wording the customer actually accepted.
-- Rows written before this migration keep '2026-08-16' on purpose — that is
-- the wording those customers agreed to.
UPDATE site_settings SET value = '2026-09-03' WHERE key = 'terms_version';

INSERT INTO site_settings (key, value) VALUES ('terms_version', '2026-09-03')
ON CONFLICT (key) DO NOTHING;
