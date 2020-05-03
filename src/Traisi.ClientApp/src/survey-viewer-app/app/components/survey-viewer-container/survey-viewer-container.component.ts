import { Component, ComponentFactoryResolver, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { SurveyViewerService } from '../../services/survey-viewer.service';
import { SurveyErrorComponent } from '../survey-error/survey-error.component';
import { SurveyStartPageComponent } from '../survey-start-page/survey-start-page.component';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';
import { SurveyViewerSession } from 'app/services/survey-viewer-session.service';
declare var Modernizr;
@Component({
	encapsulation: ViewEncapsulation.None,
	selector: 'app-survey-viewer-container',
	templateUrl: './survey-viewer-container.component.html',
	styleUrls: ['./survey-viewer-container.component.scss'],
	entryComponents: [SurveyErrorComponent, SurveyStartPageComponent]
})
export class SurveyViewerContainerComponent implements OnInit {
	private surveyName: string;
	public hasGeneratedShortcode: boolean;

	/**
	 *
	 * @param surveySession
	 * @param _titleService
	 * @param _toastr
	 * @param surveyViewer
	 */
	constructor(
		public surveySession: SurveyViewerSession,
		private _titleService: Title,
		private _toastr: ToastrService,
		public surveyViewer: SurveyViewerService
	) {
		this.hasGeneratedShortcode = false;
	}

	/**
	 *
	 */
	public ngOnInit(): void {
		this.surveySession.data.subscribe(data => {
			this._titleService.setTitle('TRAISI - ' + data.surveyTitle);
		});
		if (Modernizr.mq('(max-width: 768px)')) {
			this._toastr.info('A desktop view may provide a better experience for answering some questions', 'Mobile Dislay', {
				positionClass: 'toast-top-full-width',
				timeOut: 5000,
				toastClass: 'ngx-toastr mobile-toast',
				messageClass: 'mobile-toast-message', 
				titleClass: 'mobile-toast-title',
				progressBar: true,
				closeButton: true,
				tapToDismiss: false,
			});
		}
	}
}