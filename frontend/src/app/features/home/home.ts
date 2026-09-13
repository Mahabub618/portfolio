import { Component } from '@angular/core';
import { SiteFooter } from '../../shared/site-footer';
import { SiteNav } from '../../shared/site-nav';
import { Achievements } from './achievements';
import { Contact } from './contact';
import { Education } from './education';
import { ExtracurricularSection } from './extracurricular';
import { Hero } from './hero';
import { Projects } from './projects';
import { TravelStrip } from './travel-strip';

@Component({
  imports: [SiteNav, SiteFooter, Hero, Projects, Education, Achievements, ExtracurricularSection, TravelStrip, Contact],
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
      <app-contact />
    </main>
    <app-site-footer />
  `,
})
export class Home {}
