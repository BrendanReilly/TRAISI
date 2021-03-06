
import {mergeMap, map, filter} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Router, NavigationEnd, PRIMARY_OUTLET } from '@angular/router';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';



import { Utilities } from '../../../shared/services/utilities';

@Injectable({ providedIn: 'root'})
export class AppTitleService {

	sub: Subscription;
	appName: string;

	constructor(private titleService: Title, private router: Router) {
		this.sub = this.router.events.pipe(
			filter(event => event instanceof NavigationEnd),
			map(_ => this.router.routerState.root),
			map(route => {
				while (route.firstChild) {
					route = route.firstChild;
				}

				return route;
			}),
			mergeMap(route => route.data), )
			.subscribe(data => {
				let title = data['title'];

				if (title) {
					let fragment = this.router.url.split('#')[1];

					if (fragment) {
						title += ' | ' + Utilities.toTitleCase(fragment);
					}
				}

				if (title && this.appName) {
					title += ' - ' + this.appName;
				} else if (this.appName) {
					title = this.appName;
				}

				if (title) {
					this.titleService.setTitle(title);
				}
			});
	}

}
