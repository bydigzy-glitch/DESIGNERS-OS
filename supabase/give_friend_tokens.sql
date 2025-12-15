-- Give 50,000 tokens to strfanantonio@gmail.com
-- User ID: cc4238f8-aabe-4a72-99b8-229dccc93bbf
UPDATE users
SET tokens = 50000
WHERE id = 'cc4238f8-aabe-4a72-99b8-229dccc93bbf';
-- Verify the update
SELECT id,
    email,
    name,
    tokens
FROM users
WHERE id = 'cc4238f8-aabe-4a72-99b8-229dccc93bbf';