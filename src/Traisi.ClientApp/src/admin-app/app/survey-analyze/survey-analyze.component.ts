import { Component, OnInit, NgModule } from '@angular/core';
import { fadeInOut } from '../services/animations';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
	selector: 'app-survey-analyze',
	templateUrl: './survey-analyze.component.html',
	styleUrls: ['./survey-analyze.component.scss'],
	animations: [fadeInOut],
})
@NgModule({
	imports: [NgSelectModule],
})
export class SurveyAnalyzeComponent implements OnInit {
	public surveyId: number;

	constructor(private httpObj: HttpClient, private route: ActivatedRoute) {
		this.route.params.subscribe((params) => (this.surveyId = params['id']));
	}

	//Sample Distribution Analysis
	public daysInField: number = 10;
	public avgResponsePerDay = 40;
	public completed = 0;
	public incomplete: number = 0;

	public colorClasses: string[] = [
		'progress-bar bg-success',
		'progress-bar bg-info',
		'progress-bar bg-warning',
		'progress-bar bg-primary',
	];
	public responses: any = [];
	public serverData: any = {};
	public actualResponses: any = [];

	public questions: any = [];
	public questionResults: any = [];
	public questionOptionLabels: any = [];

	public selectedRegion: string = '';
	public selectedQuestion: string = '1';

	public matrixResults: any = [];
	public travelDiaryResults: any = [];
	public transitRoutesResults: any = [];
	public locationResults: any = [];
	public householdResults: any = [];

	//Question type tables
	public questionTable: boolean = false;

	//question type tables
	public x: boolean = false;
	public y: boolean = false;

	public ngOnInit(): void {
		//Load Question names
		//api analytics controller url
		let url = '/api/SurveyAnalytics/' + this.surveyId;
		this.httpObj.get(url).subscribe((resData: any[]) => {
			this.questions = resData;
			this.questions = this.questions.filter((item) => item.id != 133);
		});
		this.filterByQuestion();
	}

	public filterByCity() {
		if (this.selectedRegion == '') this.responses = this.actualResponses;
		else this.responses = this.actualResponses.filter((item) => item.city == this.selectedRegion);
		if (this.selectedRegion == '') this.responses = this.actualResponses;
		else this.responses = this.actualResponses.filter((item) => item.city == this.selectedRegion);

		this.handleResponses();
	}

	public filterByQuestion() {
		if (this.selectedQuestion == 'Select Question') {
			this.serverData = [];
			this.responses = [];
			this.actualResponses = [];
			this.completed = 0;
			this.incomplete = 0;
			this.questionResults = [];
			return;
		}

		//api analytics controller url
		this.questionTable = false;
		this.questionResults = [];
		let url = '/api/SurveyAnalytics/' + this.surveyId + '/' + this.selectedQuestion;
		this.httpObj.get(url).subscribe((resData: any) => {
			//Radio, Checkbox question type results
			if (resData.questionTypeResults != undefined) {
				this.questionTable = true;
				this.serverData = resData;
				this.responses = resData.completedResponses;
				this.actualResponses = resData.completedResponses;
				this.completed = resData.totalComplete;
				this.incomplete = resData.totalIncomplete;
				this.questionResults = resData.questionTypeResults;
				this.handleResponses();
			}
			//Matrix question type results
			else if (resData.matrixResults != undefined) {
				var ar: any[] = [];
				ar.push(resData.matrixResults);
				this.questionResults = ar;
			}
			//Travel diary question type results
			else if (resData.travelDiaryResults != undefined) {
				this.questionTable = false;
				var ar: any[] = [];
				ar.push(resData.travelDiaryResults);
				this.questionResults = ar;
			}
			//Transit routes question type results
			else if (resData.transitRoutesResults != undefined) {
				this.questionTable = false;
				var ar: any[] = [];
				ar.push(resData.transitRoutesResults);
				this.questionResults = ar;
			}
			//Location question type results
			else if (resData.locationResults != undefined) {
				this.questionTable = false;
				var ar: any[] = [];
				ar.push(resData.locationResults);
				this.questionResults = ar;
			}
			//Household question type results
			else if (resData.householdResults != undefined) {
				this.questionTable = false;
				var ar: any[] = [];
				ar.push(resData.householdResults);
				this.questionResults = ar;
			}
			//Added all question-type responses code
			//In case if any questions data is not found
			else if (resData.matrixResults != undefined) {
				this.x = false;
				this.y = true;
				this.matrixResults = resData.matrixResults;
			}
			//I'll remove once all question-type responses code
			//added to SurveyAnalyticsController
			else {
				this.serverData = [];
				this.responses = [];
				this.actualResponses = [];
				this.completed = 0;
				this.incomplete = 0;
				this.questionResults = [];
			}
		});
	}

	public handleResponses() {
		for (let i = 0, j = 0; i < this.responses.length; i++) {
			let compSurveyByCity = this.responses[i].surveyCompleted;
			let incompSurveyByCity = this.serverData.incompletedResponses.find(
				(item) => item.city == this.responses[i].city
			).surveyIncompleted;
			let rPercent = (compSurveyByCity / incompSurveyByCity) * 100;

			this.responses[i].compSurveyByCity = compSurveyByCity;
			this.responses[i].incompSurveyByCity = incompSurveyByCity;
			this.responses[i].percentage = Math.round(rPercent) + '%';
			this.responses[i].pending = 100 - Math.round(rPercent) + '%';
			this.responses[i].pending = 100 - Math.round(rPercent) + '%';

			j++;
			if (j >= this.colorClasses.length) j = 0;
		}
		//Question type/options results count
		var total = 0;
		for (let i = 0; i < this.questionResults.length; i++) {
			total += this.questionResults[i].count;
		}
		//Percentage calculation
		for (let i = 0; i < this.questionResults.length; i++) {
			let rPercent = (this.questionResults[i].count / total) * 100;
			this.questionResults[i].percentage = Math.round(rPercent) + '%';
		}
	}
}
