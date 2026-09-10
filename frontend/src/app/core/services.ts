import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Api } from './api';
import {
  Achievement,
  BlogDetail,
  BlogSummary,
  EducationEntry,
  Extracurricular,
  Page,
  Profile,
  Project,
} from './models';

/**
 * Normalises a collection response to a plain array.
 * The backend paginates some resources ({ items, total, … }) and returns a bare
 * array for others; consumers should never have to care which.
 */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(Api);
  get(): Observable<Profile> {
    return this.api.get<Profile>('/profile');
  }
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly api = inject(Api);
  list(page = 1, size = 50, tag?: string): Observable<Page<Project>> {
    return this.api.get<Page<Project>>('/projects', { page, size, tag });
  }
}

@Injectable({ providedIn: 'root' })
export class EducationService {
  private readonly api = inject(Api);
  list(): Observable<EducationEntry[]> {
    return this.api.get<EducationEntry[]>('/education');
  }
}

@Injectable({ providedIn: 'root' })
export class AchievementsService {
  private readonly api = inject(Api);
  list(category?: string): Observable<Achievement[]> {
    return this.api.get<Achievement[]>('/achievements', { category });
  }
}

@Injectable({ providedIn: 'root' })
export class ExtracurricularService {
  private readonly api = inject(Api);
  list(): Observable<Extracurricular[]> {
    return this.api.get<Extracurricular[]>('/extracurricular');
  }
}

@Injectable({ providedIn: 'root' })
export class BlogsService {
  private readonly api = inject(Api);
  list(page = 1, size = 12): Observable<Page<BlogSummary>> {
    return this.api.get<Page<BlogSummary>>('/blogs', { page, size });
  }
  get(id: string): Observable<BlogDetail> {
    return this.api.get<BlogDetail>(`/blogs/${id}`);
  }
}
