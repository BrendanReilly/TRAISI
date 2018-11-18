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
	HostListener,
	ElementRef
} from '@angular/core';
import { SurveyViewerService } from '../../services/survey-viewer.service';
import { QuestionLoaderService } from '../../services/question-loader.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SurveyViewPage } from '../../models/survey-view-page.model';
import { SurveyHeaderDisplayComponent } from '../survey-header-display/survey-header-display.component';
import { sortBy } from 'lodash';
import { QuestionContainerComponent } from '../question-container/question-container.component';
import { SurveyQuestion, ResponseValidationState } from 'traisi-question-sdk';
import { SurveyViewQuestion } from '../../models/survey-view-question.model';
import { SurveyViewSection } from '../../models/survey-view-section.model';
import { SurveyViewerState } from '../../models/survey-viewer-state.model';
import { SurveyResponderService } from '../../services/survey-responder.service';
import { SurveyViewGroupMember } from '../../models/survey-view-group-member.model';
import { SurveyViewerStateService } from '../../services/survey-viewer-state.service';
import { trigger, state, style, animate, transition, stagger, query, keyframes } from '@angular/animations';
import { SurveyViewerTheme } from '../../models/survey-viewer-theme.model';
import { Header1Component } from '../special-page-builder/header1/header1.component';
import { Header2Component } from '../special-page-builder/header2/header2.component';
import { Footer1Component } from '../special-page-builder/footer1/footer1.component';
import { Utilities } from 'shared/services/utilities';
import { SurveyUser } from 'shared/models/survey-user.model';
import { SurveyQuestionContainer } from '../../services/survey-viewer-navigation/survey-question-container';
import { SurveyViewerNavigationService } from '../../services/survey-viewer-navigation/survey-viewer-navigation.service';
import { SurveySectionContainer } from '../../services/survey-viewer-navigation/survey-section-container';
import { SurveyGroupContainer } from '../../services/survey-viewer-navigation/survey-group-container';
import { SurveyRepeatContainer } from '../../services/survey-viewer-navigation/survey-repeat-container';
import { SurveySectionRepeatContainer } from 'app/services/survey-viewer-navigation/survey-section-repeat-container';
import { SurveyPageContainer } from '../../services/survey-viewer-navigation/survey-page-container';
import { Title } from '@angular/platform-browser';

interface SpecialPageDataInput {
	pageHTML: string;
	pageThemeInfo: string;
}

@Component({
	selector: 'traisi-survey-viewer',
	templateUrl: './survey-viewer.component.html',
	styleUrls: ['./survey-viewer.component.scss'],
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
						animate('1s', keyframes([style({ opacity: 1 }), style({ opacity: 0, display: 'none' })]))
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
export class SurveyViewerComponent implements OnInit, AfterViewInit, AfterContentInit, AfterViewChecked {
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

	@ViewChild(SurveyHeaderDisplayComponent)
	public headerDisplay: SurveyHeaderDisplayComponent;

	@ViewChildren('questions')
	public questionContainers!: QueryList<QuestionContainerComponent>;

	public activeQuestion: any;

	public surveyName: string;

	private _activeQuestionContainer: QuestionContainerComponent;

	public ref: SurveyViewerComponent;

	public validationStates: typeof ResponseValidationState = ResponseValidationState;

	public get viewerState(): SurveyViewerState {
		return this._viewerStateService.viewerState;
	}

	public set viewerState(viewerState: SurveyViewerState) {
		this._viewerStateService.viewerState = viewerState;
	}

	public get isNavigationPreviousEnabled(): boolean {
		return this._navigation.isNavigationPreviousEnabled;
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
			return this.currentUser.roles.includes('super administrator');
		}
	}

	/**
	 * Creates an instance of survey viewer component.
	 * @param surveyViewerService
	 * @param _surveyResponderService
	 * @param _viewerStateService
	 * @param _navigation
	 * @param route
	 * @param elementRef
	 */
	constructor(
		@Inject('SurveyViewerService') private surveyViewerService: SurveyViewerService,
		@Inject('SurveyResponderService') private _surveyResponderService: SurveyResponderService,
		private _viewerStateService: SurveyViewerStateService,
		private _navigation: SurveyViewerNavigationService,
		private route: ActivatedRoute,
		private _router: Router,
		private _titleService: Title,
		private elementRef: ElementRef
	) {
		this.ref = this;
	}

	/**
	 * Initialization
	 */
	public ngOnInit(): void {
		this.currentUser = this.surveyViewerService.currentUser;

		this.route.queryParams.subscribe((value: Params) => {
			this.surveyViewerService.activeSurveyId.subscribe((surveyId: number) => {
				this.surveyId = surveyId;

				this.surveyViewerService.activeSurveyTitle.subscribe(title => {
					this._titleService.setTitle(`TRAISI - ${title}`);
				});
				this.surveyViewerService.getSurveyViewPages(this.surveyId).subscribe((pages: SurveyViewPage[]) => {
					pages.forEach(page => {
						this.headerDisplay.completedPages.push(false);
					});
					this.loadQuestions(pages);
				});
			});
		});

		this.surveyViewerService.pageThemeInfoJson.subscribe((pageTheme: any) => {
			this.pageThemeInfo = pageTheme;

			let theme: SurveyViewerTheme = {
				sectionBackgroundColour: null,
				questionViewerColour: null,
				viewerTemplate: null
			};

			theme.sectionBackgroundColour = pageTheme['householdHeaderColour'];
			theme.questionViewerColour = pageTheme['questionViewerColour'];
			theme.viewerTemplate = JSON.parse(pageTheme['viewerTemplate']);

			this.viewerTheme = theme;
			theme.viewerTemplate.forEach(sectionInfo => {
				if (sectionInfo.sectionType.startsWith('header')) {
					this.headerComponent = this.getComponent(sectionInfo.sectionType);
					this.headerHTML = sectionInfo.html;
				} else if (sectionInfo.sectionType.startsWith('footer')) {
					this.footerComponent = this.getComponent(sectionInfo.sectionType);
					this.footerHTML = sectionInfo.html;
				}
			});
			this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = this.pageThemeInfo.pageBackgroundColour;
			this.pageTextColour = this.getBestPageTextColour();
			this.questionTextColour = this.getBestQuestionBodyTextColor();
			this.sectionTitleColour = this.getBestSectionTitleColour();
			this.navButtonClass = this.useDarkButtons() ? 'btn-inverse' : 'btn-default';
			this.useLightNavigationLines = this.pageTextColour === 'rgb(255,255,255)';
			this.setComponentInputs();
			this.loadedComponents = true;
		});

		this.route.parent.params.subscribe(params => {
			this.surveyName = params['surveyName'];
		});

		this.isShowComplete = false;
	}

	/**
	 *
	 */
	private surveyQuestionsChanged: () => void = () => {
		// update the validation based on new survey questions and active question
		// this.validateNavigation();
	};

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
		console.log(pages);
		this._surveyResponderService.getSurveyGroupMembers().subscribe((members: Array<SurveyViewGroupMember>) => {
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
				let pageContainer = new SurveyPageContainer(page, this._viewerStateService);
				page.questions.forEach(question => {
					question.pageIndex = pageCount;
					question.viewOrder = viewOrder;
					question.parentPage = page;
					question.viewId = Symbol();
					this.questionTypeMap[question.questionId] = question.questionType;
					this.questionNameMap[question.name] = question.questionId;
					this.questions.push(question);
					pageQuestionCount++;

					if (question.repeatTargets === undefined) {
						question.repeatTargets = [];
					}

					this.viewerState.questionMap[question.questionId] = question;

					if (question.isRepeat) {
						this.viewerState.questionMap[question.repeatSource].repeatTargets.push(question.questionId);
					}

					let sectionRepeatContainer = new SurveySectionRepeatContainer(null, this._viewerStateService);

					sectionRepeatContainer.order = question.order;

					let groupContainer = new SurveyGroupContainer(
						this._viewerStateService,
						this.viewerState.primaryRespondent
					);

					let sectionContainer = new SurveySectionContainer(null, this._viewerStateService);

					let repeatContainer = new SurveyRepeatContainer(
						question,
						this._viewerStateService,
						this.viewerState.primaryRespondent
					);

					let container = new SurveyQuestionContainer(question, sectionContainer);

					repeatContainer.addQuestionContainer(container);

					groupContainer.repeatContainers.push(repeatContainer);

					sectionContainer.groupContainers.push(groupContainer);

					sectionRepeatContainer.children.push(sectionContainer);

					pageContainer.children.push(sectionRepeatContainer);
				});

				page.sections.forEach(section => {
					let inSectionIndex: number = 0;
					section.questions.forEach(question => {
						question.pageIndex = pageCount;
						question.viewOrder = viewOrder;
						question.parentSection = section;
						question.inSectionIndex = inSectionIndex;
						this.viewerState.questionMap[question.questionId] = question;
						question.viewId = Symbol();
						this.questionTypeMap[question.questionId] = question.questionType;
						this.questionNameMap[question.name] = question.questionId;
						this.questions.push(question);
						this.viewerState.sectionMap[section.id] = section;
						if (section.isRepeat) {
							this.viewerState.questionMap[section.repeatSource].repeatTargets.push(section.id);
						}
						pageQuestionCount++;
						if (question.repeatTargets === undefined) {
							question.repeatTargets = [];
						}
						if (question.isRepeat) {
							this.viewerState.questionMap[question.repeatSource].repeatTargets.push(question.questionId);
						}
						inSectionIndex++;

						// try to find existing container
						let sectionContainer: SurveySectionContainer;

						let sectionRepeatContainer: SurveySectionRepeatContainer;

						let index = pageContainer.children.findIndex(container2 => {
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

						sectionContainer.activeGroupContainer.initialize();
					});
				});

				if (pageQuestionCount > 0) {
					this.viewerState.viewContainers.push(pageContainer);
					pageContainer.children = sortBy(pageContainer.children, ['order']);
					pageCount += 1;
					this.viewerState.surveyPages.push(page);
				}
			});

			viewOrder = 0;
			this.viewerState.viewContainers.forEach(page => {
				page.children.forEach(sectionRepeat => {
					sectionRepeat.children.forEach(section => {
						section.children.forEach(group => {
							group.forRespondent = this.viewerState.primaryRespondent;
							group.children.forEach(repeat => {
								repeat.forRespondent = this.viewerState.primaryRespondent;
								repeat.children.forEach(question => {
									question.questionModel.repeatTargets = Array.from(
										new Set(question.questionModel.repeatTargets)
									);
									question.forRespondent = this.viewerState.primaryRespondent;
									question.questionModel.viewOrder = viewOrder;
								});
							});
						});
					});
					viewOrder++;
				});
			});

			this.viewerState.activeQuestionIndex = 0;

			this.viewerState.surveyQuestionsFull = this.viewerState.surveyQuestions.concat([]);

			this.viewerState.activeQuestionIndex = 0;
			this.viewerState.activePageIndex = 0;

			this._navigation.navigationCompleted.subscribe(this.navigationCompleted);
			this._navigation.initialize();

			this.viewerState.isLoaded = true;
			this.viewerState.isQuestionLoaded = true;
		});
	}

	/**
	 * Gets group member completion state
	 * @param groupMemberIndex
	 * @returns true if group member completion state
	 */
	public getGroupMemberCompletionState(groupMemberIndex: number): boolean {
		let currentQ: SurveyQuestionContainer = <SurveyQuestionContainer>this.viewerState.activeQuestionContainer;
		if (currentQ !== undefined && currentQ.parentSectionContainer !== null) {
			let section = currentQ.parentSectionContainer.children[groupMemberIndex];
			return section ? section.isComplete : false;
		} else {
			return false;
		}
	}

	/**
	 *
	 * @param state
	 */
	private onNavigationStateChanged: (state: boolean) => void = (newState: boolean) => {};

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

	public updateNavigation(): void {
		let conditionalResult = this._viewerStateService.evaluateConditionals(
			this.viewerState.activeQuestion.questionId,
			this.viewerState.isSectionActive && this.viewerState.activeQuestion.parentSection.isHousehold
				? this.viewerState.groupMembers[this.viewerState.activeGroupMemberIndex].id
				: this.viewerState.primaryRespondent.id
		);

		conditionalResult.subscribe((value: void) => {
			this._viewerStateService
				.evaluateRepeat(
					this.viewerState.surveyQuestions[this.viewerState.activeQuestionIndex],
					this.viewerState.isSectionActive && this.viewerState.activeQuestion.parentSection.isHousehold
						? this.viewerState.groupMembers[this.viewerState.activeGroupMemberIndex].id
						: this.viewerState.primaryRespondent.id
				)
				.subscribe((v: void) => {
					if (!this.validateInternalNavigationNext()) {
					}
				});
		});
	}

	/**
	 * Navigation completed of survey viewer component
	 */
	public navigationCompleted = (navStatus: boolean) => {
		this.viewerState.isNavProcessing = false;
	};

	/**
	 * Navigates previous
	 */
	public navigatePrevious(): void {
		this.viewerState.isNavProcessing = true;
		this._navigation.navigatePrevious();
	}

	/**
	 * Navigates next
	 */
	public navigateNext(): void {
		this.viewerState.isNavProcessing = true;
		this._navigation.navigateNext();
	}

	/**
	 * Shows group member
	 * @param memberIndex
	 */
	public showGroupMember(memberIndex: number): void {
		const activePage = <SurveyPageContainer>this.viewerState.activeViewContainer;

		const activeSection = activePage.activeRepeatContainer.activeSection;

		activeSection.setGroupMemberActive(memberIndex);

		this._navigation.updateState();
	}

	/**
	 *
	 */
	private callVisibilityHooks(): void {
		if (this._activeQuestionContainer !== undefined) {
			if (this._activeQuestionContainer.surveyQuestionInstance != null) {
				if (
					(<any>this._activeQuestionContainer.surveyQuestionInstance).__proto__.hasOwnProperty(
						'onQuestionShown'
					)
				) {
					(<any>this._activeQuestionContainer.surveyQuestionInstance).onQuestionShown();
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
			return this.viewerState.groupMembers[this.viewerState.activeGroupMemberIndex].id;
		} else {
			return this.viewerState.primaryRespondent.id;
		}
	}

	private retrieveHouseholdTag(): string {
		let questionId: number = +Object.keys(this.questionTypeMap).find(
			key => this.questionTypeMap[key] === 'household'
		);
		return Object.keys(this.questionNameMap).find(key => this.questionNameMap[key] === questionId);
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

			if (s.length > 1) {
			}

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
			return Utilities.whiteOrBlackText(this.pageThemeInfo.pageBackgroundColour);
		} else {
			return 'rgb(0,0,0)';
		}
	}

	private getBestSectionTitleColour(): string {
		if (this.pageThemeInfo.pageBackgroundColour) {
			return Utilities.whiteOrBlackText(this.viewerTheme.sectionBackgroundColour);
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
			return Utilities.whiteOrBlackText(this.pageThemeInfo.questionViewerColour);
		} else {
			return 'rgb(0,0,0)';
		}
	}

	// public onQuestionScroll($event) {}
}
