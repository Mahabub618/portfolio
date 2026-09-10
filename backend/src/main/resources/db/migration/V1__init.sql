CREATE TABLE admin_user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profile (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  tagline          VARCHAR(255),
  intro            TEXT,
  photo_url        VARCHAR(512),
  photo_alt        VARCHAR(255),
  banner_image_url VARCHAR(512),
  banner_alt       VARCHAR(255),
  social_links     JSONB NOT NULL DEFAULT '{}'::jsonb,
  cta_config       JSONB NOT NULL DEFAULT '[]'::jsonb,
  resume_url       VARCHAR(512),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  long_description TEXT,
  thumbnail_url    VARCHAR(512),
  thumbnail_alt    VARCHAR(255),
  live_url         VARCHAR(512),
  repo_url         VARCHAR(512),
  tech_tags        TEXT[] NOT NULL DEFAULT '{}',
  display_order    INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_display_order ON project (display_order);
CREATE INDEX idx_project_tech_tags ON project USING GIN (tech_tags);

CREATE TABLE education (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution    VARCHAR(255) NOT NULL,
  degree         VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255),
  start_date     DATE,
  end_date       DATE,
  grade_or_gpa   VARCHAR(50),
  description    TEXT,
  display_order  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_education_display_order ON education (display_order);

CREATE TABLE achievement (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      VARCHAR(100) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  platform      VARCHAR(100),
  rank          VARCHAR(100),
  rating        VARCHAR(50),
  standing_url  VARCHAR(512),
  achieved_date DATE,
  description   TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_achievement_display_order ON achievement (display_order);
CREATE INDEX idx_achievement_category ON achievement (category);

CREATE TABLE extracurricular (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255) NOT NULL,
  organization  VARCHAR(255),
  role          VARCHAR(255),
  start_date    DATE,
  end_date      DATE,
  description   TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_extracurricular_display_order ON extracurricular (display_order);

CREATE TABLE travel_blog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  location        VARCHAR(255),
  blog_date       DATE,
  cover_photo_url VARCHAR(512),
  cover_photo_alt VARCHAR(255),
  summary         TEXT,
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_travel_blog_display_order ON travel_blog (display_order);

CREATE TABLE travel_blog_photo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id       UUID NOT NULL REFERENCES travel_blog(id) ON DELETE CASCADE,
  photo_url     VARCHAR(512) NOT NULL,
  alt_text      VARCHAR(255),
  caption       TEXT,
  display_order INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_travel_blog_photo_blog ON travel_blog_photo (blog_id, display_order);
