import { Component } from '@angular/core';
import { SiteFooter } from '../../shared/site-footer';
import { SiteNav } from '../../shared/site-nav';
import { Achievements } from './achievements';
import { Education } from './education';
import { ExtracurricularSection } from './extracurricular';
import { Hero } from './hero';
import { Projects } from './projects';
import { TravelStrip } from './travel-strip';

@Component({
  imports: [SiteNav, SiteFooter, Hero, Projects, Education, Achievements, ExtracurricularSection, TravelStrip],
  selector: 'app-home',
  template: `
    <app-site-nav />
    <main>
      <app-hero />
      <app-projects />
      <app-education />
      <app-achievements />
      <app-extracurricular />
      <app-travel-strip />
    </main>
    <app-site-footer />
  `,
})
export class Home {}
