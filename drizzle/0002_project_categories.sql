-- Projects now use the standards' categories (user decision 2026-10-21, HANDOFF G-52).
-- Data-only: the column definition is unchanged (no table rebuild, so no cascading deletes).
-- A legacy category (equipment, software, services, works, other) becomes the single
-- non-General category of the project's applied standards (e.g. only CITS-2026 → 'IT & security'),
-- or 'General' when it has none or several, so every applied standard still fits.
UPDATE `projects`
SET `category` = COALESCE(
  (
    SELECT CASE WHEN COUNT(DISTINCT s.`category`) = 1 THEN MIN(s.`category`) END
    FROM `project_standards` ps
    JOIN `standards` s ON s.`id` = ps.`standard_id`
    WHERE ps.`project_id` = `projects`.`id`
      AND s.`category` IN ('IT & security', 'Safety & environment', 'Commercial & legal', 'Quality')
  ),
  'General'
)
WHERE `category` NOT IN ('IT & security', 'Safety & environment', 'Commercial & legal', 'Quality', 'General');
