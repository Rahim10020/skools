-- Normalise le genre vers des libellés complets : M -> Masculin, F -> Féminin.
-- (Les fiches détail tolèrent encore les anciens codes M/F.)
UPDATE "students" SET "gender" = 'Masculin' WHERE "gender" = 'M';
UPDATE "students" SET "gender" = 'Féminin' WHERE "gender" = 'F';
UPDATE "teachers" SET "gender" = 'Masculin' WHERE "gender" = 'M';
UPDATE "teachers" SET "gender" = 'Féminin' WHERE "gender" = 'F';
