import { Injectable, Inject } from '@angular/core';
import { SurveyViewerStateService } from '../../../../services/survey-viewer-state.service';
import { Subject, Observable, Observer, BehaviorSubject, EMPTY, forkJoin } from 'rxjs';
import { NavigationState } from '../../../../models/navigation-state.model';
import { QuestionInstance } from 'app/models/question-instance.model';
import { findIndex, every } from 'lodash';
import { expand, share, tap, flatMap, map, count, takeWhile, take, shareReplay } from 'rxjs/operators';
import { ConditionalEvaluator } from 'app/services/conditional-evaluator/conditional-evaluator.service';
import { QuestionInstanceState } from 'app/services/question-instance.service';
import { ValidationState } from 'app/services/survey-viewer-api-client.service';
import { SurveyViewerRespondentService } from 'app/services/survey-viewer-respondent.service';
import {
	SurveyRespondent,
	TraisiValues,
	SurveyViewPage,
	SurveyViewSection,
	SurveyViewQuestion,
} from 'traisi-question-sdk';
import { ViewTransformer } from './view-transformer.service';
import { SurveyViewerValidationStateViewModel } from 'traisi-question-sdk';
import { SurveyViewerResponseService } from 'app/services/survey-viewer-response.service';

/**
 *
 *
 * @export
 * @class SurveyNavigator
 */
@Injectable({
	providedIn: 'root',
})
export class SurveyNavigator {
	/**
	 * Navigation state changed event emitter.
	 */
	public navigationStateChanged: Subject<NavigationState>;

	/**
	 * The current navigation state.
	 */
	public navigationState$: BehaviorSubject<NavigationState>;

	/**
	 * @type {BehaviorSubject<boolean>}
	 */
	public previousEnabled$: BehaviorSubject<boolean>;

	public nextEnabled$: BehaviorSubject<boolean>;

	public logicState$: Subject<any>;

	private _surveyCompleted$: Subject<void>;

	private _previousState: NavigationState;

	/**
	 * Listen for the end of the survey
	 */
	public get surveyCompleted$(): Observable<void> {
		return this._surveyCompleted$;
	}

	/**
	 *Creates an instance of SurveyNavigator.
	 * @param {SurveyViewerStateService} _surveyState
	 * @memberof SurveyNavigator
	 */
	public constructor(
		private _state: SurveyViewerStateService,
		private _conditionalEvaluator: ConditionalEvaluator,
		@Inject(TraisiValues.SurveyResponseService)
		private _responseService: SurveyViewerResponseService,
		private _viewTransformer: ViewTransformer
	) {
		this.navigationStateChanged = new Subject<NavigationState>();
		let initialState: NavigationState = {
			activeQuestionInstances: [],
			hiddenQuestions: [],
			isLoaded: false,
			activeQuestionIndex: 0,
			isNextEnabled: false,
			isPreviousEnabled: false,
			activeValidationStates: [],
		};
		this.navigationState$ = new BehaviorSubject<NavigationState>(initialState);
		this.previousEnabled$ = new BehaviorSubject<boolean>(false);
		this.nextEnabled$ = new BehaviorSubject<boolean>(false);
		this.navigationStateChanged.next(initialState);
		this._surveyCompleted$ = new Subject<void>();
	}

	/**
	 * Initialize the survey navigator
	 * @param state Pass a base state, optional
	 */
	public initialize(state?: NavigationState): Observable<NavigationState> {
		this.navigationState$.subscribe((v) => this._navigationStateChanged(v));
		this.navigationState$.subscribe(this._excludeHiddenResponses);
		if (state) {
			if (state.activeRespondentIndex > this._state.viewerState.groupMembers.length) {
				state.activeRespondentIndex = 0;
			}
			state.isLoaded = true;
			state.activeRespondent = this._state.viewerState.groupMembers[state.activeRespondentIndex];
			return this._initState(state).pipe(
				tap((v) => {
					if (state.activeQuestionIndex > 0) {
						this.previousEnabled$.next(true);
					}
					this.navigationState$.next(v);
				})
			);
		}
		return new Observable((obs) => {
			this.navigateToPage(this._state.viewerState.surveyPages[0].id).subscribe((v) => {
				obs.complete();
				this.nextEnabled$.next(false);
			});
		});
	}

	/**
	 * Tells the viewer to update validation states and other information
	 * @param state
	 */
	private _navigationStateChanged(state: NavigationState): void {
		this._state.updateStates(state);
	}

	/**
	 * Called at the end of a navigation iteration to exclude hidden content.
	 * @param state
	 */
	private _excludeHiddenResponses = (state: NavigationState) => {
		if (state.hiddenQuestions && state.hiddenQuestions.length > 0) {
			this._responseService.excludeResponses(state.hiddenQuestions, state.activeRespondent).subscribe({
				next: () => {},
				complete: () => {},
			});
			this._responseService
				.excludeResponses(
					state.activeQuestionInstances.map((q) => q.model),
					state.activeRespondent,
					false
				)
				.subscribe({
					next: () => {},
					complete: () => {},
				});
		}
	};

	/**
	 *
	 * @param part
	 */
	public _getBaseQuestionModels(part: SurveyViewPage | SurveyViewSection): SurveyViewQuestion[] {
		let questions = [];
		questions = questions.concat(part.questions);
		return questions;
	}

	/**
	 * Navigate to the next viewable portion of the survey
	 */
	public navigateNext(): Observable<NavigationState> {
		this._previousState = this.navigationState$.value;
		let nav = this._incrementNavigation(this._newState());
		this.nextEnabled$.next(false);
		nav.subscribe((state) => {
			this.previousEnabled$.next(true);
			this.navigationState$.next(state);
			this._checkValidation(state);
		});
		return nav;
	}

	/**
	 * Navigate to the previous question or section.
	 */
	public navigatePrevious(): Observable<NavigationState> {
		this._previousState = this.navigationState$.value;
		let prev = this._decrementNavigation(this._newState());
		prev.subscribe((state) => {
			this.navigationState$.next(state);
			if (state.activeQuestionIndex === 0) {
				this.previousEnabled$.next(false);
			}
			this._checkValidation(state);
		});
		return prev;
	}

	/**
	 *
	 * @param questionId
	 */
	public navigateToQuestion(questionId: number): Observable<NavigationState> {
		let blockIndex = -1;
		for (let i = 0; i < this._state.viewerState.questionBlocks.length; i++) {
			let blocks = this._state.viewerState.questionBlocks[i];
			blockIndex = findIndex(blocks, (block: SurveyViewQuestion) => {
				return block.questionId === questionId;
			});
			if (blockIndex >= 0) {
				blockIndex = i;
				break;
			}
		}
		if (blockIndex < 0) {
			blockIndex = 0;
		}
		let pageIndex = this._state.viewerState.questionBlocks[blockIndex][0]?.pageIndex;

		return new Observable((obs: Observer<NavigationState>) => {
			let navigationState: NavigationState = {
				activePage: this._state.viewerState.surveyPages[pageIndex],
				activeSectionIndex: -1,
				activeSectionId: this._state.viewerState.questionBlocks[blockIndex][0]?.parentSection?.id,
				activeSection: this._state.viewerState.questionBlocks[blockIndex][0]?.parentSection,
				activeQuestionIndex: blockIndex,
				activeRespondent: this._getRespondentForIdx(this._currentState.activeRespondentIndex),
				activeRespondentIndex: this._currentState.activeRespondentIndex,
				activeQuestionInstances: [],
				isLoaded: true,
				isNextEnabled: true,
				activeValidationStates: [],
				isPreviousEnabled: true,
				hiddenQuestions: [],
			};

			this._initState(navigationState).subscribe((r) => {
				this.navigationState$.next(r);
				obs.next(r);
				obs.complete();
			});

			this._initQuestionInstancesForState(navigationState).subscribe((questionInstances) => {
				navigationState.activeQuestionInstances = questionInstances;
				this.validationChanged();
			});
		});
	}

	/**
	 *
	 * @param idx
	 */
	public _getRespondentForIdx(idx: number): SurveyRespondent {
		if (idx >= 0 && idx < this._state.viewerState.groupMembers.length) {
			// console.log('in here ');
			return this._state.viewerState.groupMembers[idx ?? 0];
		} else {
			// return the primary respondent
			return this._state.viewerState.groupMembers[0];
		}
	}

	/**
	 *
	 * @param page
	 * @param section
	 */
	public navigateToSection(page: SurveyViewPage, section: SurveyViewSection): Observable<NavigationState> {
		let blockIndex: number = findIndex(this._state.viewerState.questionBlocks, (block: SurveyViewQuestion[]) => {
			return block[0].parentSection?.id === section.id;
		});
		if (blockIndex < 0) {
			blockIndex = 0;
		}
		let pageIndex = findIndex(this._state.viewerState.questionBlocks, (block: SurveyViewQuestion[]) => {
			return this._state.viewerState.surveyPages[block[0]?.pageIndex]?.id === page.id;
		});
		return new Observable((obs: Observer<NavigationState>) => {
			let navigationState: NavigationState = {
				activePage: this._state.viewerState.surveyPages[pageIndex],
				activeSectionIndex: -1,
				activeSectionId: section.id,
				activeSection: section,
				activeQuestionIndex: blockIndex,
				activeRespondent: this._state.viewerState.primaryRespondent,
				activeRespondentIndex: 0,
				activeQuestionInstances: [],
				isLoaded: true,
				isNextEnabled: true,
				activeValidationStates: [],
				isPreviousEnabled: true,
				hiddenQuestions: [],
			};

			this._initState(navigationState).subscribe((r) => {
				this.navigationState$.next(r);
				obs.next(r);
				obs.complete();
			});

			this._initQuestionInstancesForState(navigationState).subscribe((questionInstances) => {
				navigationState.activeQuestionInstances = questionInstances;
				this.validationChanged();
			});
		});
	}

	/**
	 *
	 * @param pageId
	 */
	public navigateToPage(pageId: number): Observable<NavigationState> {
		let pageIndex = findIndex(this._state.viewerState.surveyPages, (q: SurveyViewPage) => {
			return q.id === pageId;
		});
		if (pageIndex < 0) {
			pageIndex = 0;
		}
		// find question index of page
		let page = this._state.viewerState.surveyPages[pageIndex];

		let blockIndex: number = findIndex(this._state.viewerState.questionBlocks, (block: SurveyViewQuestion[]) => {
			return this._state.viewerState.surveyPages[block[0]?.pageIndex]?.id === page.id;
		});

		if (blockIndex < 0) {
			blockIndex = 0;
		}

		return new Observable((obs: Observer<NavigationState>) => {
			let navigationState: NavigationState = {
				activePage: this._state.viewerState.surveyPages[pageIndex],
				activeSectionIndex: -1,
				activeSectionId: this._state.viewerState.questionBlocks[blockIndex][0]?.parentSection?.id,
				activeSection: this._state.viewerState.questionBlocks[blockIndex][0]?.parentSection,
				activeQuestionIndex: blockIndex,
				activeRespondent: this._state.viewerState.primaryRespondent,
				activeRespondentIndex: 0,
				activeQuestionInstances: [],
				isLoaded: true,
				isNextEnabled: true,
				activeValidationStates: [],
				isPreviousEnabled: true,
				hiddenQuestions: [],
			};
			this._initState(navigationState).subscribe((r) => {
				this.navigationState$.next(r);
				obs.next(r);
				obs.complete();
			});
		});
	}

	/**
	 * Increments the current navigation state
	 * @param currentState
	 */
	private _incrementNavigation(currentState: NavigationState): Observable<NavigationState> {
		const newState: NavigationState = Object.assign({}, currentState);
		// get active question
		if (
			!currentState.activeQuestionInstances[0]?.component?.navigateInternalNext() &&
			currentState.activeQuestionInstances.length > 0
		) {
			// ignore
		} else if (
			currentState.activeSection?.isHousehold &&
			currentState.activeRespondentIndex < this._state.viewerState.groupMembers.length - 1
		) {
			newState.activeRespondentIndex++;
			newState.activeRespondent = this._state.viewerState.groupMembers[newState.activeRespondentIndex];
		} else {
			newState.activeQuestionIndex += 1;
			newState.activeRespondentIndex = 0;
			newState.activeRespondent = this._state.viewerState.groupMembers[newState.activeRespondentIndex];
		}
		if (this._isOutsideSurveyBounds(newState)) {
			this._surveyCompleted$.complete();
			return EMPTY;
		} else {
			return this._initState(newState).pipe(
				expand((state) => {
					return state.activeQuestionInstances.length === 0 ? this._incrementNavigation(newState) : EMPTY;
				}),
				tap((x) => {}),
				shareReplay(1)
			);
		}
	}

	/**
	 * Determines if the current state is outside survey limits.
	 * @param state
	 */
	private _isOutsideSurveyBounds(state: NavigationState): boolean {
		return state.activeQuestionIndex >= this._state.viewerState.questionBlocks.length;
	}

	/**
	 * Decrements the current navigation state.
	 * @param currentState
	 */
	private _decrementNavigation(currentState: NavigationState): Observable<NavigationState> {
		const newState: NavigationState = Object.assign({}, this.navigationState$.value);

		if (newState.activeQuestionInstances[0]?.component?.canNavigateInternalPrevious()) {
			newState.activeQuestionInstances[0].component.navigateInternalPrevious();
		} else if (newState.activeSection?.isHousehold && newState.activeRespondentIndex > 0) {
			newState.activeRespondentIndex--;
		} else if (newState.activeSection?.isHousehold && newState.activeRespondentIndex === 0) {
			newState.activeRespondentIndex = this._state.viewerState.groupMembers.length - 1;
			newState.activeQuestionIndex -= 1;
			newState.activeRespondent = this._state.viewerState.groupMembers[newState.activeRespondentIndex];
		} else {
			newState.activeRespondentIndex = 0;
			newState.activeQuestionIndex -= 1;
			newState.activeRespondent = this._state.viewerState.groupMembers[newState.activeRespondentIndex];
		}
		return this._initState(newState).pipe(
			expand((state) => {
				return state.activeQuestionInstances.length === 0 ? this._decrementNavigation(currentState) : EMPTY;
			}),
			tap((x) => {}),
			shareReplay(1)
		);
	}

	/**
	 *
	 * @param navigationState
	 */
	private _initState(navigationState: NavigationState): Observable<NavigationState> {
		return new Observable((obs: Observer<NavigationState>) => {
			this._initQuestionInstancesForState(navigationState).subscribe((questionInstances) => {
				console.log('here');
				navigationState.activeQuestionInstances = [];
				// navigationState.hiddenQuestions = [];
				if (questionInstances.length > 0) {
					if (navigationState.activeRespondentIndex > this._state.viewerState.groupMembers.length - 1) {
						navigationState.activeRespondentIndex = 0;
					}
					navigationState.activePage = this._state.viewerState.surveyPages[
						questionInstances[0]?.model.pageIndex
					];
					navigationState.activeSectionId = -1;
					navigationState.activeSectionId = questionInstances[0]?.model.parentSection?.id;
					navigationState.activeSection = questionInstances[0]?.model.parentSection;
					navigationState.activeRespondent = this._getRespondentForIdx(navigationState.activeRespondentIndex);

					for (let question of questionInstances) {
						let instanceId = this.getQuestionInstanceId(
							question.model,
							0,
							navigationState.activeRespondent
						);
						let prevIdx = findIndex(
							this._currentState.activeQuestionInstances,
							(instance: { id: string }) => {
								return instance.id === instanceId;
							}
						);
						if (prevIdx >= 0) {
							navigationState.activeQuestionInstances.push(
								this._currentState.activeQuestionInstances[prevIdx]
							);
						} else {
							question.validationState = {
								isValid: false,
								questionValidationState: {
									validationState: ValidationState.Untouched,
									errorMessages: [],
								},
								surveyLogicValidationState: {
									validationState: ValidationState.Untouched,
									errorMessages: [],
								},
							};
							navigationState.activeQuestionInstances.push(question);
						}
					}
				}
				obs.next(navigationState);
				obs.complete();
			});
		});
	}

	/**
	 *
	 * @param navigationState
	 * @param evaluateConditions
	 */
	private _initQuestionInstancesForState(navigationState: NavigationState): Observable<QuestionInstance[]> {
		let questions: SurveyViewQuestion[] = [];
		questions = questions.concat(this._state.viewerState.questionBlocks[navigationState.activeQuestionIndex]);
		if (navigationState.activeQuestionIndex >= this._state.viewerState.questionBlocks.length) {
			return Observable.of([]);
		} else {
			let questionInstances = [];
			let evals = [];
			navigationState.activeRespondent = this._state.viewerState.groupMembers[
				navigationState.activeRespondentIndex
			];
			for (let question of questions) {
				evals.push(this._conditionalEvaluator.shouldHide(question, navigationState.activeRespondent));
			}

			return new Observable((obs) => {
				forkJoin(evals).subscribe(
					(
						results: Array<{
							shouldHide: boolean;
							question: SurveyViewQuestion;
						}>
					) => {
						let order = 0;
						console.log(results);
						for (let result of results) {
							result.question.isHidden = result.shouldHide;

							if (result.shouldHide) {
								if (!navigationState.hiddenQuestions) {
									navigationState.hiddenQuestions = [];
								}
								navigationState.hiddenQuestions.push(result.question);
								continue;
							} else {
								result.question.inSectionIndex = order++;
							}
							let instanceId = this.getQuestionInstanceId(
								result.question,
								0,
								navigationState.activeRespondent
							);
							let prevIdx = findIndex(
								this.navigationState$.value.activeQuestionInstances,
								(instance: { id: string }) => {
									return instance.id === instanceId;
								}
							);

							if (prevIdx >= 0) {
								questionInstances.push(this.navigationState$.value.activeQuestionInstances[prevIdx]);
							} else {
								let questionInstance: QuestionInstance = {
									id: instanceId,
									index: navigationState.activeQuestionIndex,
									model: result.question,
									component: null,
									repeat: 0,
									questionInstanceState: null,
									validationState: {
										isValid: false,
										questionValidationState: {
											validationState: ValidationState.Untouched,
											errorMessages: [],
										},
										surveyLogicValidationState: {
											validationState: ValidationState.Untouched,
											errorMessages: [],
										},
									},
								};
								questionInstances.push(questionInstance);
							}
						}
						this._viewTransformer
							.applyViewTransformations(navigationState, questionInstances)
							.subscribe((instances: QuestionInstance[]) => {
								obs.next(instances);
								obs.complete();
							});
					}
				);
			});
		}
	}

	/**
	 *
	 * @param question
	 * @param repeat
	 */
	private getQuestionInstanceId(
		question: SurveyViewQuestion,
		repeat: number = 0,
		respondent: SurveyRespondent
	): string {
		return `${question.id}_${respondent.id}_${repeat}`;
	}

	/**
	 *
	 */
	private get _currentState(): NavigationState {
		return this.navigationState$.getValue();
	}

	/**
	 *
	 */
	private _checkValidation(state: NavigationState): boolean {
		let allValid: boolean = true;

		if (state.activeQuestionInstances.length === 0) {
			return false;
		}
		for (let instance of state.activeQuestionInstances) {
			if (!instance.validationState.isValid && !instance.model.isOptional) {
				allValid = false;
				break;
			}
		}
		return allValid;
	}

	/**
	 *
	 */
	public validationChanged(): void {
		this.nextEnabled$.next(this._checkValidation(this._currentState));
	}

	/**
	 * Updates the validation state in the navigation manager
	 * @param instanceState
	 * @param result
	 */
	public updateQuestionValidationState(
		instanceState: QuestionInstanceState,
		result: SurveyViewerValidationStateViewModel
	): void {
		let match = this._currentState.activeQuestionInstances.find(
			(i) => i.id === this.getQuestionInstanceId(instanceState.guestionModel, 0, instanceState.respondent)
		);
		if (match) {
			match.validationState = result;
			this.validationChanged();
		}
	}

	/**
	 *
	 */
	private _newState(): NavigationState {
		return this._initializeNavigationSate(this._currentState);
	}

	/**
	 *
	 * @param baseState
	 */
	private _initializeNavigationSate(baseState: NavigationState): NavigationState {
		return {
			activeQuestionIndex: baseState.activeQuestionIndex,
			activeQuestionInstances: baseState.activeQuestionInstances,
			isLoaded: true,
			isNextEnabled: true,
			isPreviousEnabled: true,
			activeValidationStates: [],
			activePage: baseState.activePage,
			activePageIndex: baseState.activePageIndex,
			activeRespondent: undefined,
			activeRespondentIndex: baseState.activeRespondentIndex,
			activeSection: baseState.activeSection,
			activeSectionIndex: baseState.activeSectionIndex,
			activeSectionId: baseState.activeSectionId,
			hiddenQuestions: [],
		};
	}

	/**
	 *
	 */
	public responseChanged(): void {
		let newState: NavigationState = this._initializeNavigationSate(this._currentState);
		this._initState(newState).subscribe((v) => {
			this.navigationState$.next(v);
			this.nextEnabled$.next(this._checkValidation(v));
		});
	}
}
