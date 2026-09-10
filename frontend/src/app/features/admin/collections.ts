import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudManager, ColumnDef, FieldDef } from './crud-manager';

/* Thin wrappers: each collection page is just field/column descriptors. */

const PROJECT_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'displayOrder', label: 'Display order', type: 'number' },
  { key: 'description', label: 'Short description', type: 'textarea', required: true, full: true },
  { key: 'longDescription', label: 'Long description (markdown-ish, shown in modal)', type: 'textarea', full: true },
  { key: 'thumbnailUrl', label: 'Thumbnail URL', type: 'url', hint: 'Upload via the photo manager on the blog editor, or paste any URL' },
  { key: 'thumbnailAlt', label: 'Thumbnail alt text' },
  { key: 'liveUrl', label: 'Live URL', type: 'url' },
  { key: 'repoUrl', label: 'Repository URL', type: 'url' },
  { key: 'techTags', label: 'Tech tags', type: 'tags', full: true, hint: 'Comma separated, e.g. Angular, Spring Boot, PostgreSQL' },
];
const PROJECT_COLUMNS: ColumnDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'techTags', label: 'Tech', type: 'tags' },
  { key: 'updatedAt', label: 'Updated', type: 'datetime' },
];

@Component({
  selector: 'app-projects-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CrudManager],
  template: `<app-crud-manager title="Projects" singular="project" path="/projects"
    subtitle="Cards on the home page; tags power the filter chips."
    [fields]="fields" [columns]="columns" />`,
})
export class ProjectsAdmin {
  readonly fields = PROJECT_FIELDS;
  readonly columns = PROJECT_COLUMNS;
}

const EDUCATION_FIELDS: FieldDef[] = [
  { key: 'institution', label: 'Institution', required: true },
  { key: 'displayOrder', label: 'Display order', type: 'number' },
  { key: 'degree', label: 'Degree', required: true },
  { key: 'fieldOfStudy', label: 'Field of study' },
  { key: 'startDate', label: 'Start date', type: 'date' },
  { key: 'endDate', label: 'End date', type: 'date', hint: 'Leave blank for ongoing' },
  { key: 'gradeOrGpa', label: 'Grade / GPA' },
  { key: 'description', label: 'Description', type: 'textarea', full: true },
];
const EDUCATION_COLUMNS: ColumnDef[] = [
  { key: 'institution', label: 'Institution' },
  { key: 'degree', label: 'Degree' },
  { key: 'startDate', label: 'Start', type: 'date' },
];

@Component({
  selector: 'app-education-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CrudManager],
  template: `<app-crud-manager title="Education" singular="entry" path="/education"
    subtitle="Timeline on the home page, newest first by display order."
    [fields]="fields" [columns]="columns" />`,
})
export class EducationAdmin {
  readonly fields = EDUCATION_FIELDS;
  readonly columns = EDUCATION_COLUMNS;
}

const ACHIEVEMENT_FIELDS: FieldDef[] = [
  { key: 'category', label: 'Category', required: true, hint: 'Free text, e.g. Competitive Programming, Scholarship' },
  { key: 'displayOrder', label: 'Display order', type: 'number' },
  { key: 'title', label: 'Title', required: true },
  { key: 'platform', label: 'Platform', hint: 'e.g. Codeforces — feeds the stat row' },
  { key: 'rank', label: 'Rank', hint: 'e.g. Expert' },
  { key: 'rating', label: 'Rating', hint: 'Numeric ratings power the stat row' },
  { key: 'achievedDate', label: 'Achieved date', type: 'date' },
  { key: 'standingUrl', label: 'Standing / proof URL', type: 'url' },
  { key: 'description', label: 'Description', type: 'textarea', full: true },
];
const ACHIEVEMENT_COLUMNS: ColumnDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'platform', label: 'Platform' },
  { key: 'rating', label: 'Rating' },
];

@Component({
  selector: 'app-achievements-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CrudManager],
  template: `<app-crud-manager title="Achievements" singular="achievement" path="/achievements"
    subtitle="The stat-highlight row is computed from ratings you enter here."
    [fields]="fields" [columns]="columns" />`,
})
export class AchievementsAdmin {
  readonly fields = ACHIEVEMENT_FIELDS;
  readonly columns = ACHIEVEMENT_COLUMNS;
}

const ACTIVITY_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'displayOrder', label: 'Display order', type: 'number' },
  { key: 'organization', label: 'Organization' },
  { key: 'role', label: 'Role' },
  { key: 'startDate', label: 'Start date', type: 'date' },
  { key: 'endDate', label: 'End date', type: 'date' },
  { key: 'description', label: 'Description', type: 'textarea', full: true },
];
const ACTIVITY_COLUMNS: ColumnDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'role', label: 'Role' },
  { key: 'organization', label: 'Organization' },
];

@Component({
  selector: 'app-activities-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CrudManager],
  template: `<app-crud-manager title="Extracurricular" singular="activity" path="/extracurricular"
    subtitle="Clubs, volunteering, leadership — the “Beyond code” section."
    [fields]="fields" [columns]="columns" />`,
})
export class ActivitiesAdmin {
  readonly fields = ACTIVITY_FIELDS;
  readonly columns = ACTIVITY_COLUMNS;
}
