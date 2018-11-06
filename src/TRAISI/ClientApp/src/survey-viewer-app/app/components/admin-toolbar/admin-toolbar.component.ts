import { Component, ComponentFactoryResolver, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { SurveyViewerService } from '../../services/survey-viewer.service';
import { QuestionLoaderService } from '../../services/question-loader.service';
import {
	ActivatedRoute,
	ActivatedRouteSnapshot,
	ActivationEnd,
	NavigationEnd,
	Router,
	RouterEvent,
	RouterStateSnapshot
} from '@angular/router';
import { SurveyErrorComponent } from '../survey-error/survey-error.component';
import { SurveyStartPageComponent } from '../survey-start-page/survey-start-page.component';

import { Title } from '@angular/platform-browser';
import { SurveyUser } from 'shared/models/survey-user.model';
import { SurveyResponderService } from 'app/services/survey-responder.service';
import { SurveyViewerStateService } from '../../services/survey-viewer-state.service';

@Component({
	encapsulation: ViewEncapsulation.None,
	selector: 'traisi-admin-toolbar',
	templateUrl: './admin-toolbar.component.html',
	styleUrls: ['./admin-toolbar.component.scss'],
	entryComponents: [SurveyErrorComponent, SurveyStartPageComponent]
})
export class AdminToolbarComponent implements OnInit {
	public surveyId: number;

	/**
	 * Creates an instance of admin toolbar component.
	 * @param surveyViewerService
	 */
	constructor(
		@Inject('SurveyViewerService') private _surveyViewerService: SurveyViewerService,
		@Inject('SurveyResponderService') private _responderService: SurveyResponderService,
		private _viewerState: SurveyViewerStateService
	) {}

	/**
	 * on init
	 */
	public ngOnInit(): void {
		this._surveyViewerService.activeSurveyId.subscribe((surveyId) => {
			this.surveyId = surveyId;
		});
	}

	/**
	 * Deletes all responses
	 */
	public deleteAllResponses(): void {
		this._responderService.deleteAllResponses(this.surveyId, this._viewerState.viewerState.primaryRespondent).subscribe(
			(result) => {
				console.log(result);
				location.reload();
			},
			(error: any) => {
				console.log(error);
			}
		);
	}
}
