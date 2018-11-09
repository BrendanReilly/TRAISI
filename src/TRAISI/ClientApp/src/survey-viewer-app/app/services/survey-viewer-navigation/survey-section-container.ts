import { SurveyContainer } from './survey-container';
import { SurveyViewQuestion } from '../../models/survey-view-question.model';
import { Subject } from 'rxjs';
import { SurveyQuestionContainer } from './survey-question-container';
import { SurveyViewSection } from 'app/models/survey-view-section.model';
import { SurveyGroupContainer } from './survey-group-container';

export class SurveySectionContainer extends SurveyContainer {
	private _sectionModel: SurveyViewSection;

	private _children: Array<SurveyGroupContainer>;

	private _activeGroupMemberIndex: number = 0;

	public get containerId(): number {
		return this._sectionModel.id;
	}

	public get activeGroupContainer(): SurveyGroupContainer {
		return this._children[this._activeGroupMemberIndex];
	}

	public get sectionModel(): SurveyViewSection {
		return this._sectionModel;
	}

	public get activeViewContainer(): SurveyContainer {
		return this._children[this._activeGroupMemberIndex].activeViewContainer;
	}

	public get activeQuestion(): SurveyViewQuestion {
		return null;
	}

	public get groupContainers(): Array<SurveyGroupContainer> {
		return this._children;
	}

	/**
	 * Gets child containers
	 */
	public get children(): Array<SurveyGroupContainer> {
		return this._children;
	}

	/**
	 * Creates an instance of survey section container.
	 * @param section
	 */
	public constructor(section: SurveyViewSection) {
		super();

		this._sectionModel = section;
		this._children = [];
	}

	/**
	 * Navigates previous
	 * @returns true if previous
	 */
	public navigatePrevious(): boolean {
		if (this.activeGroupContainer.navigatePrevious()) {
			if (this._activeGroupMemberIndex <= 0) {
				return true;
			} else {
				this.decrementGroup();

				return false;
			}
		} else {
			return false;
		}
	}

	/**
	 * Navigates next
	 * @returns true if next
	 */
	public navigateNext(): boolean {
		// returns true if there is no longer any internal navigation
		if (this.activeGroupContainer.navigateNext()) {
			if (this._activeGroupMemberIndex >= this._children.length - 1) {
				return true;
			} else {
				this.incrementGroup();

				return false;
			}
		} else {
			return false;
		}
	}

	/**
	 * Increments question
	 */
	private incrementGroup(): void {
		this._activeGroupMemberIndex++;
		// this.activeQuestionContainer.initialize();
	}

	/**
	 * Increments question
	 */
	private decrementGroup(): void {
		this._activeGroupMemberIndex--;
		// this.activeQuestionContainer.initialize();
	}

	/**
	 * Initializes survey section container
	 * @returns initialize
	 */
	public initialize(): Subject<void> {
		this._activeGroupMemberIndex = 0;
		// this.activeQuestionContainer.initialize();

		// this._children = [];

		/* his._questionContainers.forEach((container) => {
			container.initialize();
			this._children = this._children.concat(container.children);
		}); */

		return null;
	}
}
