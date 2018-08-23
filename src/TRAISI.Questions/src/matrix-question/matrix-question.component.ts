import { Component, OnInit } from '@angular/core';
import { ISurveyViewerService, IQuestionConfiguration } from 'traisi-question-sdk';
import { PartialObserver } from '../../node_modules/rxjs';
@Component({
	selector: 'traisi-matrix-question',
	template: require('./matrix-question.component.html').toString(),
	styles: [require('./matrix-question.component.scss').toString()]
})
export class MatrixQuestionComponent implements OnInit {
	readonly QUESTION_TYPE_NAME: string = 'Matrix Question';

	typeName: string;
	icon: string;
	constructor(private surveyViewerService: ISurveyViewerService) {
		this.typeName = this.QUESTION_TYPE_NAME;
		this.icon = 'matrix';

		this.surveyViewerService.configurationData.subscribe(this.loadConfigurationData);
	}

	/**
	 * Loads configuration data once it is available.
	 * @param data
	 */
	loadConfigurationData(data: IQuestionConfiguration[]){

		console.log(data);
	}

	ngOnInit() {
	}
}