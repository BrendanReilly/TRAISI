import {
	Component,
	ComponentRef,
	Input,
	OnInit,
	OnDestroy,
	ViewChild,
	ViewContainerRef,
	Inject,
	ChangeDetectionStrategy,
	ChangeDetectorRef
} from '@angular/core';
import { QuestionLoaderService } from '../../services/question-loader.service';
import { SurveyViewerService } from '../../services/survey-viewer.service';
import { SurveyViewQuestionOption } from '../../models/survey-view-question-option.model';
import { OnOptionsLoaded, OnSurveyQuestionInit, SurveyResponder, SurveyQuestion, ResponseValidationState } from 'traisi-question-sdk';
import { SurveyResponderService } from '../../services/survey-responder.service';
import { SurveyViewQuestion as ISurveyQuestion, SurveyViewQuestion } from '../../models/survey-view-question.model';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { BehaviorSubject } from 'rxjs';
import { SurveyViewerComponent } from '../survey-viewer/survey-viewer.component';
import { SurveyViewGroupMember } from '../../models/survey-view-group-member.model';
import { SurveyViewerStateService } from '../../services/survey-viewer-state.service';

export { IconDefinition } from '@fortawesome/free-solid-svg-icons';
@Component({
	selector: 'traisi-question-container',
	templateUrl: './question-container.component.html',
	styleUrls: ['./question-container.component.scss']
})
export class QuestionContainerComponent implements OnInit, OnDestroy {
	@Input()
	public question: ISurveyQuestion;

	@Input()
	public surveyId: number;

	@Input()
	public questionIndex: number;

	@Input()
	public surveyViewer: SurveyViewerComponent;

	@Input()
	public surveyViewQuestion: SurveyViewQuestion;

	@Input()
	public respondent: SurveyViewGroupMember;

	@ViewChild('questionTemplate', { read: ViewContainerRef })
	public questionOutlet: ViewContainerRef;

	public titleLabel: BehaviorSubject<string>;

	private _questionInstance: SurveyQuestion<any>;

	get surveyQuestionInstance(): SurveyQuestion<any> {
		return this._questionInstance;
	}

	public isLoaded: boolean = false;

	public validationStates: typeof ResponseValidationState = ResponseValidationState;

	public responseValidationState: ResponseValidationState;

	/**
	 * Creates an instance of question container component.
	 * @param questionLoaderService
	 * @param surveyViewerService
	 * @param _viewerStateService
	 * @param cdRef
	 * @param responderService
	 * @param viewContainerRef
	 */
	constructor(
		@Inject('QuestionLoaderService') private questionLoaderService: QuestionLoaderService,
		@Inject('SurveyViewerService') private surveyViewerService: SurveyViewerService,
		private _viewerStateService: SurveyViewerStateService,
		private cdRef: ChangeDetectorRef,
		private responderService: SurveyResponderService,
		public viewContainerRef: ViewContainerRef
	) {}

	/**
	 * Unregister question etc and unsubscribe certain subs
	 */
	public ngOnDestroy(): void {}

	/**
	 *
	 */
	public ngOnInit(): void {
		/**
		 * Load the question component into the specified question outlet.
		 */

		this.responseValidationState = ResponseValidationState.PRISTINE;

		this.titleLabel = new BehaviorSubject(this.question.label);

		this.questionLoaderService
			.loadQuestionComponent(this.question, this.questionOutlet)
			.subscribe((componentRef: ComponentRef<any>) => {
				let surveyQuestionInstance = <SurveyQuestion<any>>componentRef.instance;

				surveyQuestionInstance.loadConfiguration(this.question.configuration);

				// call traisiOnInit to notify of initialization finishing
				surveyQuestionInstance.questionId = this.question.questionId;

				surveyQuestionInstance.surveyId = this.surveyId;

				(<SurveyQuestion<any>>componentRef.instance).configuration = this.question.configuration;

				this.responderService.registerQuestion(componentRef.instance, this.surveyId, this.question.questionId, this.respondent.id);

				this.responderService
					.getSavedResponse(this.surveyId, this.question.questionId, this.respondent.id)
					.subscribe((response) => {
						surveyQuestionInstance.savedResponse.next(response == null ? 'none' : response.responseValues);

						surveyQuestionInstance.traisiOnLoaded();
					});

				surveyQuestionInstance.validationState.subscribe(this.onResponseValidationStateChanged);

				surveyQuestionInstance.traisiOnInit();

				this.surveyViewerService
					.getQuestionOptions(this.surveyId, this.question.questionId, 'en', null)
					.subscribe((options: SurveyViewQuestionOption[]) => {
						this.isLoaded = true;

						this._questionInstance = componentRef.instance;
						if (componentRef.instance.__proto__.hasOwnProperty('onOptionsLoaded')) {
							(<OnOptionsLoaded>componentRef.instance).onOptionsLoaded(options);
						}

						if (componentRef.instance.__proto__.hasOwnProperty('onSurveyQuestionInit')) {
							(<OnSurveyQuestionInit>componentRef.instance).onSurveyQuestionInit(this.question.configuration);
						}
					});
			});
	}

	/**
	 * Determines whether response validation state changed on
	 */
	private onResponseValidationStateChanged: (validationState: ResponseValidationState) => void = (
		validationState: ResponseValidationState
	): void => {

		this._viewerStateService.updateGroupQuestionValidationState(this.surveyViewQuestion, validationState);
		this.responseValidationState = validationState;
		this.surveyViewer.validateNavigation();
	};
}
