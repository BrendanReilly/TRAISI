import {Component, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {AlertService, MessageSeverity} from "../../../services/alert.service";

@Component({
	selector: 'app-survey-welcome-page',
	templateUrl: './survey-welcome-page.component.html',
	styleUrls: ['./survey-welcome-page.component.scss']
})
export class SurveyWelcomePageComponent implements OnInit {

	surveyName: string;

	isLoading:boolean = false;

	shortcode:string;


	/**
	 *
	 * @param alertService
	 */
	constructor(private alertService: AlertService) {
	}

	ngOnInit() {
		this.shortcode = "";
	}

	showErrorAlert(caption: string, message: string):void
	{
		this.alertService.showMessage(caption, message, MessageSeverity.error);
	}

	startSurvey():void
	{
		console.log("start survey");
		this.isLoading = true;
	}

}