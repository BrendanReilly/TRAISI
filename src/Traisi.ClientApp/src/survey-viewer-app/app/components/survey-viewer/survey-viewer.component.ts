import {
	animate,
	keyframes,
	query,
	stagger,
	style,
	transition,
	trigger
} from '@angular/animations';
import {
	AfterContentInit,
	AfterViewChecked,
	AfterViewInit,
	Component,
	ElementRef,
	Inject,
	OnInit,
	QueryList,
	ViewChild,
	ViewChildren
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyViewerSessionData } from 'app/models/survey-viewer-session-data.model';
import { SurveyViewerSession } from 'app/services/survey-viewer-session.service';
import { sortBy } from 'lodash';
import { flatMap, share } from 'rxjs/operators';
import { SurveyUser } from 'shared/models/survey-user.model';
import { Utilities } from 'shared/services/utilities';
import { ResponseValidationState, SurveyRespondent } from 'traisi-question-sdk';
import { SurveyViewGroupMember } from '../../models/survey-view-group-member.model';
import { SurveyViewPage } from '../../models/survey-view-page.model';
import { SurveyViewQuestion } from '../../models/survey-view-question.model';
import { SurveyViewerState } from '../../models/survey-viewer-state.model';
import { SurveyViewerTheme } from '../../models/survey-viewer-theme.model';
import { SurveyResponderService } from '../../services/survey-responder.service';
import { SurveyViewerStateService } from '../../services/survey-viewer-state.service';
import { SurveyViewerService } from '../../services/survey-viewer.service';
import { QuestionContainerComponent } from '../question-container/question-container.component';
import { Footer1Component } from '../special-page-builder/footer1/footer1.component';
import { Header1Component } from '../special-page-builder/header1/header1.component';
// import { Header2Component } from '../special-page-builder/header2/header2.component';
import { SurveyHeaderDisplayComponent } from '../survey-header-display/survey-header-display.component';
import { Header2Component } from '../special-page-builder/header2/header2.component';
import { SurveyNavigator } from 'app/modules/survey-navigation/services/survey-navigator/survey-navigator.service';
import Headroom from 'headroom.js';
interface SpecialPageDataInput {
	pageHTML: string;
	pageThemeInfo: string;
}

@Component({
	selector: 'traisi-survey-viewer',
	templateUrl: './survey-viewer.component.html',
	styleUrls: [
		'./survey-viewer.component.scss',
		'./survey-viewer.component.md.scss'
	],
	animations: [
		trigger('visibleHidden', [
			/*transition('hidden => visible', [
				// query(':enter', style({ opacity: 0 }), { optional: true }),
				// query(':leave', style({ opacity: 1 }), { optional: true }),
				query(':self', stagger('1s', [animate('1s', keyframes([style({ opacity: 0 }), style({ opacity: 1 })]))]), {
					optional: true
				})
			]), */
			transition('* => hidden', [
				// query(':enter', style({ opacity: 0 }), { optional: true }),
				// query(':leave', style({ opacity: 1 }), { optional: true }),
				query(
					':self',
					stagger('1s', [
						animate(
							'1s',
							keyframes([
								style({ opacity: 1 }),
								style({ opacity: 0, display: 'none' })
							])
						)
					]),
					{
						optional: true
					}
				)
			])
		])
	],
	providers: []
})
export class SurveyViewerComponent
	implements OnInit, AfterViewInit, AfterContentInit, AfterViewChecked {
	public questions: Array<SurveyViewQuestion>;
	public questionTypeMap: { [id: number]: string };
	public questionNameMap: { [name: string]: number };

	public surveyId: number;

	public titleText: string;

	public loadedComponents: boolean = false;
	public headerComponent: any;
	public headerHTML: string;
	public headerInputs: SpecialPageDataInput;

	public footerComponent: any;
	public footerHTML: string;
	public footerInputs: SpecialPageDataInput;

	public navButtonClass: string;
	public pageTextColour: string;
	public questionTextColour: string;
	public sectionTitleColour: string;
	public useLightNavigationLines: boolean;

	public scrollTop: number = 0;

	@ViewChild('surveyBodyContainer')
	public surveyBodyContainer: ElementRef;

	@ViewChild(SurveyHeaderDisplayComponent)
	public headerDisplay: SurveyHeaderDisplayComponent;

	@ViewChildren('questions')
	public questionContainers!: QueryList<QuestionContainerComponent>;

	@ViewChild('questionsContainer')
	public questionsContainerElement: ElementRef;

	@ViewChild('questionSection')
	public questionSectionElement: ElementRef;

	public activeQuestion: any;

	public surveyName: string;

	public session: SurveyViewerSessionData;

	private _activeQuestionContainer: QuestionContainerComponent;

	public ref: SurveyViewerComponent;

	public validationStates: typeof ResponseValidationState = ResponseValidationState;

	public get viewerState(): SurveyViewerState {
		return this._viewerStateService.viewerState;
	}

	public set viewerState(viewerState: SurveyViewerState) {
		this._viewerStateService.viewerState = viewerState;
	}

	public pageThemeInfo: any;
	public viewerTheme: SurveyViewerTheme;

	public isShowComplete: boolean = false;

	public currentUser: SurveyUser;

	/**
	 * Gets whether is admin
	 */
	public get isAdmin(): boolean {
		if (this.currentUser === undefined) {
			return false;
		} else {
			return (
				this.currentUser !== undefined &&
				this.currentUser.roles.includes('super administrator')
			);
		}
	}

	/**
	 *Creates an instance of SurveyViewerComponent.
	 * @param {SurveyViewerService} surveyViewerService
	 * @param {SurveyResponderService} _surveyResponderService
	 * @param {SurveyViewerStateService} _viewerStateService
	 * @param {SurveyViewerNavigationService} _navigationService
	 * @param {SurveyViewerSession} _sessionService
	 * @param {ActivatedRoute} route
	 * @param {Router} _router
	 * @param {Title} _titleService
	 * @param {ElementRef} elementRef
	 * @memberof SurveyViewerComponent
	 */
	constructor(
		@Inject('SurveyViewerService')
		private surveyViewerService: SurveyViewerService,
		@Inject('SurveyResponderService')
		private _surveyResponderService: SurveyResponderService,
		private _viewerStateService: SurveyViewerStateService,
		public navigator: SurveyNavigator,
		private _sessionService: SurveyViewerSession,
		private _route: ActivatedRoute,
		private _router: Router,
		private _titleService: Title,
		private elementRef: ElementRef
	) {
		this.ref = this;
		this.viewerState.isLoaded = false;
		this.viewerState.isQuestionLoaded = false;
	}

	/**
	 * Initialization
	 */
	public ngOnInit(): void {
		this.currentUser = this.surveyViewerService.currentUser;
		this._sessionService.data
			.pipe(
				flatMap((session: SurveyViewerSessionData) => {
					this.session = session;
					this.surveyId = session.surveyId;
					this.surveyName = session.surveyCode;
					this._titleService.setTitle(
						`TRAISI - ${session.surveyTitle}`
					);
					return this.surveyViewerService.pageThemeInfoJson;
				}),
				share(),
				flatMap((pageTheme: any) => {
					this.pageThemeInfo = pageTheme;

					let theme: SurveyViewerTheme = {
						sectionBackgroundColour: null,
						questionViewerColour: null,
						viewerTemplate: null
					};
					theme.sectionBackgroundColour =
						pageTheme['householdHeaderColour'];
					theme.questionViewerColour =
						pageTheme['questionViewerColour'];

					try {
						theme.viewerTemplate = JSON.parse(
							pageTheme['viewerTemplate']
						);
					} catch {
						theme.viewerTemplate = [];
					}

					this.viewerTheme = theme;
					theme.viewerTemplate.forEach(sectionInfo => {
						if (sectionInfo.sectionType.startsWith('header')) {
							this.headerComponent = this.getComponent(
								sectionInfo.sectionType
							);
							this.headerHTML = sectionInfo.html;
						} else if (
							sectionInfo.sectionType.startsWith('footer')
						) {
							this.footerComponent = this.getComponent(
								sectionInfo.sectionType
							);
							this.footerHTML = sectionInfo.html;
						}
					});
					this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = this.pageThemeInfo.pageBackgroundColour;
					this.pageTextColour = this.getBestPageTextColour();
					this.questionTextColour = this.getBestQuestionBodyTextColor();
					this.sectionTitleColour = this.getBestSectionTitleColour();
					this.navButtonClass = this.useDarkButtons()
						? 'btn-inverse'
						: 'btn-default';
					this.useLightNavigationLines =
						this.pageTextColour === 'rgb(255,255,255)';
					this.setComponentInputs();
					this.loadedComponents = true;
					return this.surveyViewerService.getSurveyViewPages(
						this.surveyId
					);
				}),
				share()
			)
			.subscribe((pages: SurveyViewPage[]) => {
				console.log(pages);
				pages.forEach(page => {
					this.headerDisplay.completedPages.push(false);
				});
				this.loadQuestions(pages);
			});

		this.isShowComplete = false;
	}

	/**
	 * Gets component
	 * @param componentName
	 * @returns component
	 */
	private getComponent(componentName: string): any {
		switch (componentName) {
			case 'header1':
				return Header1Component;
				break;
			case 'header2':
				return Header2Component;
				break;
			case 'footer1':
				return Footer1Component;
				break;
			default:
				return null;
				break;
		}
	}

	/**
	 *
	 *
	 * @private
	 * @memberof SurveyViewerComponent
	 */
	private setComponentInputs(): void {
		this.headerInputs = {
			pageHTML: this.headerHTML,
			pageThemeInfo: this.pageThemeInfo
		};

		this.footerInputs = {
			pageHTML: this.footerHTML,
			pageThemeInfo: this.pageThemeInfo
		};
	}

	/**
	 * Loads questions
	 * @param pages
	 */
	private loadQuestions(pages: Array<SurveyViewPage>): void {
		this._surveyResponderService
			.getSurveyPrimaryRespondent(this.surveyId)
			.pipe(
				flatMap((respondent: SurveyRespondent) => {
					this._surveyResponderService.primaryRespondent = {
						id: respondent.id,
						name: null,
						relationship: null
					};
					this.viewerState.primaryRespondent = this._surveyResponderService.primaryRespondent;
					return this._surveyResponderService.getSurveyGroupMembers(
						this._surveyResponderService.primaryRespondent
					);
				}),
				share()
			)
			.subscribe((members: Array<SurveyViewGroupMember>) => {
				if (members.length > 0) {
					this.viewerState.groupMembers = [];
					members.forEach(member => {
						this.viewerState.groupMembers.push(member);
					});
					this.viewerState.primaryRespondent = members[0];
					this.viewerState.activeRespondent = members[0];
				}

				this.questions = [];
				this.questionTypeMap = {};
				this.questionNameMap = {};
				let pageCount: number = 0;
				let viewOrder: number = 0;

				this.viewerState.surveyPages = [];
				pages.forEach(page => {
					let pageQuestionCount: number = 0;
					// let pageContainer = new SurveyPageContainer(page, this._viewerStateService);
					page.questions.forEach(question => {
						question.pageIndex = pageCount;
						question.viewOrder = viewOrder;
						question.parentPage = page;
						question.viewId = Symbol();
						this.questionTypeMap[question.questionId] =
							question.questionType;
						this.questionNameMap[question.name] =
							question.questionId;
						this.questions.push(question);
						pageQuestionCount++;

						if (question.repeatTargets === undefined) {
							question.repeatTargets = [];
						}

						this.viewerState.questionMap[
							question.questionId
						] = question;
						this.viewerState.questionViewMap[
							question.id
						] = question;

						if (question.isRepeat) {
							this.viewerState.questionMap[
								question.repeatSource
							].repeatTargets.push(question.questionId);
						}

						// let sectionRepeatContainer = new SurveySectionRepeatContainer(null, this._viewerStateService);

						// sectionRepeatContainer.order = question.order;

						// let groupContainer = new SurveyGroupContainer(this._viewerStateService, this.viewerState.primaryRespondent);

						// let sectionContainer = new SurveySectionContainer(null, this._viewerStateService);

						/*et repeatContainer = new SurveyRepeatContainer(
							question,
							this._viewerStateService,
							this.viewerState.primaryRespondent
						);

						let container = new SurveyQuestionContainer(question, sectionContainer);

						repeatContainer.addQuestionContainer(container);

						groupContainer.repeatContainers.push(repeatContainer);

						sectionContainer.groupContainers.push(groupContainer);

						sectionRepeatContainer.children.push(sectionContainer);

						pageContainer.children.push(sectionRepeatContainer); */
					});

					page.sections.forEach(section => {
						let inSectionIndex: number = 0;
						section.questions.forEach(question => {
							question.pageIndex = pageCount;
							question.viewOrder = viewOrder;
							question.parentSection = section;
							question.inSectionIndex = inSectionIndex;
							this.viewerState.questionMap[
								question.questionId
							] = question;
							this.viewerState.questionViewMap[
								question.id
							] = question;
							question.viewId = Symbol();
							this.questionTypeMap[question.questionId] =
								question.questionType;
							this.questionNameMap[question.name] =
								question.questionId;
							this.questions.push(question);
							this.viewerState.sectionMap[section.id] = section;
							if (section.isRepeat) {
								this.viewerState.questionMap[
									section.repeatSource
								].repeatTargets.push(section.id);
							}
							pageQuestionCount++;
							if (question.repeatTargets === undefined) {
								question.repeatTargets = [];
							}
							if (question.isRepeat) {
								this.viewerState.questionMap[
									question.repeatSource
								].repeatTargets.push(question.questionId);
							}
							inSectionIndex++;

							// try to find existing container
							// let sectionContainer: SurveySectionContainer;

							// let sectionRepeatContainer: SurveySectionRepeatContainer;

							/*let index = pageContainer.children.findIndex(container2 => {
								if (container2.sectionModel === null) {
									return false;
								}
								return container2.containerId === question.parentSection.id;
							});

							if (index < 0) {
								sectionRepeatContainer = SurveySectionRepeatContainer.CreateSurveySectionRepeatFromModel(
									question.parentSection,
									this._viewerStateService
								);
								sectionContainer = sectionRepeatContainer.children[0];
								pageContainer.children.push(sectionRepeatContainer);
							} else {
								sectionRepeatContainer = <SurveySectionRepeatContainer>pageContainer.children[index];
								sectionContainer = sectionRepeatContainer.children[0];
							}

							sectionRepeatContainer.createQuestionContainer(question, this.viewerState.primaryRespondent);

							sectionContainer.activeGroupContainer.initialize(); */
						});
					});

					if (pageQuestionCount > 0) {
						// this.viewerState.viewContainers.push(pageContainer);
						// pageContainer.children = sortBy(pageContainer.children, ['order']);
						pageCount += 1;
						this.viewerState.surveyPages.push(page);
					}
				});

				viewOrder = 0;
				/*this.viewerState.viewContainers.forEach(page => {
					page.children.forEach(sectionRepeat => {
						sectionRepeat.children.forEach(section => {
							section.children.forEach(group => {
								group.forRespondent = this.viewerState.primaryRespondent;
								group.children.forEach(repeat => {
									repeat.forRespondent = this.viewerState.primaryRespondent;
									repeat.children.forEach(question => {
										question.questionModel.repeatTargets = Array.from(
											new Set(
												question.questionModel.repeatTargets
											)
										);
										question.forRespondent = this.viewerState.primaryRespondent;
										question.questionModel.viewOrder = viewOrder;
									});
								});
							});
						});
						viewOrder++;
					});
				}); */

				this._surveyResponderService.initQuestionIdNameMaps(
					this._viewerStateService.viewerState
				);

				this.viewerState.activeQuestionIndex = 0;

				this.viewerState.surveyQuestionsFull = this.viewerState.surveyQuestions.concat(
					[]
				);

				this.viewerState.activeQuestionIndex = 0;
				this.viewerState.activePageIndex = 0;

				// this._navigationService.navigationCompleted.subscribe(this.navigationCompleted);
				this.navigator.surveyCompleted$.subscribe({
					complete: this.surveyCompleted
				});
				// this._navigationService.initialize();

				let questions: Array<SurveyViewQuestion> = [];
				for (let page of this.viewerState.surveyPages) {
					let qs = [];
					qs = qs.concat(page.questions);
					for (let s of page.sections) {
						qs.push(s);
					}
					qs = sortBy(qs, q => {
						return q['order'];
					});

					for (let q of qs) {
						if (q['questions'] === undefined) {
							questions.push(q);
						} else {
							for (let sectionQuestion of q['questions']) {
								questions.push(sectionQuestion);
							}
						}
					}
				}
				for (let i = 0; i < questions.length; i++) {
					questions[i].navigationOder = i;
				}
				this.viewerState.surveyQuestions = questions;
				this.navigator.initialize();
				this.viewerState.isLoaded = true;
				this.viewerState.isQuestionLoaded = true;
				console.log(this);
			});
	}

	/**
	 * Evaluates whether a household question is currently active or not
	 */
	private isHouseholdQuestionActive(): boolean {
		return (
			this.viewerState.isSectionActive &&
			this.viewerState.activeQuestion.parentSection !== undefined &&
			this.viewerState.activeQuestion.parentSection.isHousehold
		);
	}

	public trackById(index: number, item: any): string {
		let val =
			item.id +
			'_' +
			this.navigator?.navigationState$.value.activeRespondentIndex;
		return val;
	}



	/**
	 * Navigation completed of survey viewer component
	 */
	public navigationCompleted = (navStatus: boolean) => {
		this.viewerState.isNavProcessing = false;
		this.scrollTop = 0;
	};

	/**
	 *
	 */
	public surveyCompleted = () => {
		// console.log('in completed');
		this._router.navigate([this.session.surveyCode, 'thankyou']);
	};

	/**
	 * Navigates previous
	 */
	public navigatePrevious(): void {
		this.viewerState.isNavProcessing = true;
		// this._navigationService.navigatePrevious();

		this.navigator.navigatePrevious().subscribe({
			next: v => {},
			complete: () => {
				this.questionsContainerElement.nativeElement.scrollTop = 0;
				this.questionsContainerElement.nativeElement.scrollTo(0, 0);
				// console.log('navigation completed');
			}
		});
	}

	/**
	 * Navigates next
	 */
	public navigateNext(): void {
		this.viewerState.isNavProcessing = true;
		this.navigator.navigateNext().subscribe({
			next: v => {
			},
			complete: () => {
				console.log('in complete');
				this.questionsContainerElement.nativeElement.scrollTop = 0;
				this.questionsContainerElement.nativeElement.scrollTo(0, 0);
			}
		});
	}


	/**
	 *
	 */
	private callVisibilityHooks(): void {
		if (this._activeQuestionContainer !== undefined) {
			if (this._activeQuestionContainer.surveyQuestionInstance != null) {
				if (
					(<any>(
						this._activeQuestionContainer.surveyQuestionInstance
					)).__proto__.hasOwnProperty('onQuestionShown')
				) {
					(<any>(
						this._activeQuestionContainer.surveyQuestionInstance
					)).onQuestionShown();
				}
			}
		}
	}

	/**
	 * Validates internal navigation next
	 * @returns true if internal navigation next
	 */
	private validateInternalNavigationNext(): boolean {
		if (this._activeQuestionContainer.surveyQuestionInstance != null) {
			// console.log('navigate: ' + this._activeQuestionContainer.surveyQuestionInstance.canNavigateInternalNext());
			return this._activeQuestionContainer.surveyQuestionInstance.canNavigateInternalNext();
		}

		return false;
	}

	/**
	 * Validates the disabled / enabled state of the navigation buttons.
	 */
	public validateNavigation(): void {
		return;
	}

	private activeRespondentId(): number {
		if (this.isHouseholdQuestionActive()) {
			return this.viewerState.groupMembers[
				this.viewerState.activeGroupMemberIndex
			].id;
		} else {
			return this.viewerState.primaryRespondent.id;
		}
	}

	private retrieveHouseholdTag(): string {
		let questionId: number = +Object.keys(this.questionTypeMap).find(
			key => this.questionTypeMap[key] === 'household'
		);
		return Object.keys(this.questionNameMap).find(
			key => this.questionNameMap[key] === questionId
		);
	}

	public processedSectionLabel(sectionTitle: string): string {
		return Utilities.replacePlaceholder(
			sectionTitle,
			this.retrieveHouseholdTag(),
			this.viewerState.activeRespondent.name
		);
	}

	/**
	 *
	 */
	public ngAfterViewInit(): void {
		this.questionContainers.changes.subscribe(s => {
			this._activeQuestionContainer = s.first;
			setTimeout(() => {
				this.callVisibilityHooks();
				this.validateNavigation();
			});
		});
	}

	/**
	 * Navigates complete survey
	 */
	public navigateCompleteSurvey(): void {
		console.log('navigate to thankyou page ');

		this._router.navigate([this.surveyName, 'thankyou']);
	}

	public ngAfterContentInit(): void {}

	public ngAfterViewChecked(): void {}

	/**
	 * Uses dark buttons
	 * @returns true if dark buttons
	 */
	private useDarkButtons(): boolean {
		return this.pageTextColour !== 'rgb(0,0,0)';
	}

	/**
	 * Gets best page text colour
	 * @returns best page text colour
	 */
	private getBestPageTextColour(): string {
		if (this.pageThemeInfo.pageBackgroundColour) {
			return Utilities.whiteOrBlackText(
				this.pageThemeInfo.pageBackgroundColour
			);
		} else {
			return 'rgb(0,0,0)';
		}
	}

	private getBestSectionTitleColour(): string {
		if (this.pageThemeInfo.pageBackgroundColour) {
			return Utilities.whiteOrBlackText(
				this.viewerTheme.sectionBackgroundColour
			);
		} else {
			return 'rgb(0,0,0)';
		}
	}

	/**
	 * Gets best question body text color
	 * @returns best question body text color
	 */
	private getBestQuestionBodyTextColor(): string {
		if (this.pageThemeInfo.questionViewerColour) {
			return Utilities.whiteOrBlackText(
				this.pageThemeInfo.questionViewerColour
			);
		} else {
			return 'rgb(0,0,0)';
		}
	}

	// public onQuestionScroll($event) {}
}