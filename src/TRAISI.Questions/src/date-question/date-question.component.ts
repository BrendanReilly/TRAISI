import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {
	SurveyViewer, QuestionConfiguration, SurveyResponder, SurveyQuestion,
	QuestionResponseState, TRAISI
} from 'traisi-question-sdk';

@Component({
	selector: 'traisi-date-question',
	template: require('./date-question.component.html').toString(),
	styles: [require('./date-question.component.scss').toString()]
})
export class DateQuestionComponent extends TRAISI.SurveyQuestion implements OnInit, SurveyQuestion {

	readonly QUESTION_TYPE_NAME: string = 'date';

	typeName: string;
	icon: string;

	/**
	 *
	 * @param _surveyViewerService
	 * @param _surveyResponderService
	 */
	constructor(@Inject('SurveyViewerService') private _surveyViewerService: SurveyViewer,
				@Inject('SurveyResponderService') private _surveyResponderService: SurveyResponder) {
		super();
		this.typeName = this.QUESTION_TYPE_NAME;
		this.icon = 'date';

		this._surveyViewerService.configurationData.subscribe(this.loadConfigurationData);
	}

	/**
	 * Loads configuration data once it is available.
	 * @param data
	 */
	loadConfigurationData(data: QuestionConfiguration[]) {

		this.data = data;
	}

	ngOnInit() {
	}
}
