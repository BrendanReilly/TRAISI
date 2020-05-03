import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SurveyViewerService } from 'app/services/survey-viewer.service';
import { take, tap } from 'rxjs/operators';
import { SurveyData } from 'app/models/survey-data.model';

@Injectable()
export class SurveyDataResolver implements Resolve<SurveyData> {
	constructor(private _viewer: SurveyViewerService) {}

	/**
	 *
	 * @param route
	 * @param state
	 */
	public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
		return this._viewer.surveyData.pipe(
			tap(x => {
				console.log(x);
			}),
			take(1)
		);
	}
}