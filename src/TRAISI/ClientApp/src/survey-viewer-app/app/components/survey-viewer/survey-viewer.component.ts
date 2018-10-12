import {
	Component,
	OnInit,
	ViewChild,
	ViewContainerRef,
	ComponentFactory,
	SystemJsNgModuleLoader,
	Inject,
	ChangeDetectorRef,
	QueryList,
	AfterViewInit,
	AfterContentInit,
	ViewChildren,
	ContentChildren,
	AfterContentChecked,
	AfterViewChecked,
	HostListener
} from '@angular/core';
import { SurveyViewerService } from '../../services/survey-viewer.service';
import { QuestionLoaderService } from '../../services/question-loader.service';
import { ActivatedRoute, Params } from '@angular/router';
import { SurveyViewPage } from '../../models/survey-view-page.model';
import { SurveyHeaderDisplayComponent } from '../survey-header-display/survey-header-display.component';
import { sortBy } from 'lodash';
import { QuestionContainerComponent } from '../question-container/question-container.component';
import { SurveyQuestion } from 'traisi-question-sdk';
import { SurveyViewQuestion } from '../../models/survey-question.model';
@Component({
	selector: 'traisi-survey-viewer',
	templateUrl: './survey-viewer.component.html',
	styleUrls: ['./survey-viewer.component.scss']
})
export class SurveyViewerComponent implements OnInit, AfterViewInit, AfterContentInit, AfterViewChecked {

	public questions: Array<SurveyViewQuestion>;

	public surveyId: number;

	public titleText: string;

	@ViewChild(SurveyHeaderDisplayComponent)
	headerDisplay: SurveyHeaderDisplayComponent;

	@ViewChildren('questions')
	questionContainers!: QueryList<QuestionContainerComponent>;

	public activeQuestion;

	public activeQuestionIndex: number = -1;

	public activeSectionIndex: number = -1;

	public activePageIndex: number = -1;

	public isLoaded: boolean = false;

	public navigatePreviousEnabled: boolean = false;

	public navigateNextEnabled: boolean = false;

	private navigationActiveState: boolean = true;

	private _activeQuestionContainer: QuestionContainerComponent;

	private pages: Array<SurveyViewPage>;

	/**
	 *
	 * @param surveyViewerService
	 * @param questionLoaderService
	 * @param route
	 */
	constructor(
		@Inject('SurveyViewerService') private surveyViewerService: SurveyViewerService,
		private questionLoaderService: QuestionLoaderService,
		private route: ActivatedRoute,
		private cdRef: ChangeDetectorRef
	) { }

	/**
	 * Initialization
	 */
	ngOnInit() {
		// this.surveyViewerService.getWelcomeView()

		this.titleText = this.surveyViewerService.activeSurveyTitle;

		this.route.queryParams.subscribe((value: Params) => {
			this.surveyViewerService.activeSurveyId.subscribe((surveyId: number) => {
				this.surveyId = surveyId;

				this.surveyViewerService.getSurveyViewPages(this.surveyId).subscribe((pages: SurveyViewPage[]) => {
					this.headerDisplay.pages = pages;
					this.pages = pages;

					this.loadQuestions(pages);

					console.log(pages);
				});
			});
		});

		// subscribe to the navigation state change that is alterable by sub questions
		this.surveyViewerService.navigationActiveState.subscribe(this.onNavigationStateChanged);
	}

	/**
	 *
	 */
	private loadQuestions(pages: Array<SurveyViewPage>) {
		this.questions = [];
		let order: number = 0;
		let pageCount: number = 0;
		pages.forEach(page => {
			page.questions.forEach(question => {
				question.pageIndex = pageCount;
				this.questions.push(question);
			});
			page.sections.forEach(section => {
				section.questions.forEach(question => {
					question.order += order;
					question.pageIndex = pageCount;
					this.questions.push(question);
				});
				order += section.questions.length;
			});
			pageCount += 1;
		});

		this.activeQuestionIndex = 0;
		this.activePageIndex = 0;
		this.questions = sortBy(this.questions, ['order']);

		this.isLoaded = true;
	}

	/**
	 *
	 * @param state
	 */
	private onNavigationStateChanged: (state: boolean) => void = (state: boolean) => {
		this.navigationActiveState = state;
		this.validateNavigation();
	};

	/**
	 * Navigate questions - next question in the questions list.
	 */
	public navigateNext() {
		if (!this.validateInternalNavigationNext()) {
			this.activeQuestionIndex += 1;
			this.validateNavigation();
		} else {
			const result = this._activeQuestionContainer.surveyQuestionInstance.navigateInternalNext();

			if (result) {
				this.activeQuestionIndex += 1;

			}

			this.validateNavigation();

		}
	}

	/**
	 *
	 */
	private callVisibilityHooks() {
		if (this._activeQuestionContainer.surveyQuestionInstance != null) {
			if (
				(<any>this._activeQuestionContainer.surveyQuestionInstance).__proto__.hasOwnProperty('onQuestionShown')
			) {
				(<any>this._activeQuestionContainer.surveyQuestionInstance).onQuestionShown();
			}
		}
	}

	/**
	 * Navigate questions - to the previous item in the question list
	 */
	public navigatePrevious() {
		if (!this.validateInternalNavigationPrevious()) {
			this.activeQuestionIndex -= 1;
			this.navigationActiveState = true;
			this.validateNavigation();
		} else {
			this._activeQuestionContainer.surveyQuestionInstance.navigateInternalPrevious();
		}
	}

	/**
	 *
	 */
	private validateInternalNavigationNext(): boolean {
		if (this._activeQuestionContainer.surveyQuestionInstance != null) {
			return (this.navigateNextEnabled = this._activeQuestionContainer.surveyQuestionInstance.canNavigateInternalNext());
		}

		return false;
	}

	/**
	 *
	 */
	private validateInternalNavigationPrevious(): boolean {
		if (this._activeQuestionContainer.surveyQuestionInstance != null) {
			return (this.navigateNextEnabled = this._activeQuestionContainer.surveyQuestionInstance.canNavigateInternalPrevious());
		}

		return false;
	}

	/**
	 * Validates the disabled / enabled state of the navigation buttons.
	 */
	private validateNavigation() {
		if (this.activeQuestionIndex > 0) {
			this.navigatePreviousEnabled = true;
		} else {
			this.navigatePreviousEnabled = false;
		}

		if (this.navigationActiveState === false) {
			this.navigateNextEnabled = false;
		} else if (this.activeQuestionIndex >= this.questions.length - 1 && !this.validateInternalNavigationNext()) {
			this.navigateNextEnabled = false;

		} else {
			this.navigateNextEnabled = true;

		}



		this.activePageIndex = this.questions[this.activeQuestionIndex].pageIndex;

		this.headerDisplay.activePageIndex = this.activePageIndex;

	}

	/**
	 *
	 */
	ngAfterViewInit(): void {
		this.questionContainers.changes.subscribe(s => {
			this._activeQuestionContainer = s.first;

			setTimeout(() => {
				this.callVisibilityHooks();
				this.validateNavigation();
			});
		});
	}

	ngAfterContentInit(): void { }

	ngAfterViewChecked(): void { }

	public onQuestionScroll($event) {

	}
}
