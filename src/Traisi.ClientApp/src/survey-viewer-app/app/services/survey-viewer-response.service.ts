import { Injectable } from '@angular/core';
import { SurveyRespondent, SurveyQuestion, ResponseData, ResponseTypes } from 'traisi-question-sdk';
import { SurveyViewQuestion } from 'app/models/survey-view-question.model';
import { Observable, EMPTY } from 'rxjs';
import {
	SurveyResponseClient,
	SurveyRespondentClient,
	SurveyResponseViewModel,
} from './survey-viewer-api-client.service';
import { SurveyViewerSession } from './survey-viewer-session.service';
import { tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class SurveyViewerResponseService {
	private _responses: Record<number, Record<number, Array<ResponseData<ResponseTypes>>>> = {};
	public constructor(private _responseClient: SurveyResponseClient, private _session: SurveyViewerSession) {}

	/**
	 * Gets the stored response for the passed respondent and question, this will return null
	 * if the response does not alreadyt exist. This only retrieves a local copy of the response.
	 * @param question
	 * @param respondent
	 */
	public getStoredResponse(
		question: SurveyViewQuestion,
		respondent: SurveyRespondent
	): Array<ResponseData<ResponseTypes>> {
		if (!this.hasStoredResponse(question, respondent)) {
			throw Error('Asking to retrieve a response that does not exist yet.');
		}
		return this._responses[respondent.id]?.[question.questionId];
	}

	/**
	 * Determines if a response already exists for the question and respondent
	 * @param question
	 * @param respondent
	 */
	public hasStoredResponse(question: SurveyViewQuestion, respondent: SurveyRespondent): boolean {
		if (this._responses[respondent.id]?.[question.questionId]) {
			return true;
		}
		return false;
	}

	/**
	 * Stores the passed response for the associated respondent and question/
	 * @param question
	 * @param respondent
	 * @param response
	 */
	public storeResponse(
		question: SurveyViewQuestion,
		respondent: SurveyRespondent,
		response: Array<ResponseData<ResponseTypes>>
	): void {
		this._storeResponse(question.questionId, respondent, response);
	}

	private _storeResponse(
		questionId: number,
		respondent: SurveyRespondent,
		response: Array<ResponseData<ResponseTypes>>
	): void {
		// check if a store already exists for this respondent
		if (!this._responses[respondent.id]) {
			this._responses[respondent.id] = {};
		}
		this._responses[respondent.id][questionId] = response;
	}

	/**
	 * Saves the response on the server
	 * @param question
	 * @param respondent
	 * @param repeat
	 * @param responseData
	 */
	public saveResponse(
		question: SurveyViewQuestion,
		respondent: SurveyRespondent,
		repeat: number = 0,
		responseData: Array<ResponseData<ResponseTypes>>
	): Observable<boolean> {
		return new Observable((obs) => {
			this._responseClient
				.saveResponse(this._session.surveyId, question.questionId, respondent.id, repeat, responseData)
				.subscribe((result) => {
					if (result) {
						// store the passed response if valid
						this._storeResponse(question.questionId, respondent, responseData);
					}
					obs.next(result);
				});
		});
	}

	/**
	 * Loads a saved response (from server) and stores it in the response cache. The restored response
	 * is then returned.
	 * @param question
	 * @param respondent
	 * @param repeat
	 */
	public loadSavedResponse(
		question: SurveyViewQuestion,
		respondent: SurveyRespondent,
		repeat: number = 0
	): Observable<SurveyResponseViewModel> {
		return this._responseClient
			.getResponse(this._session.surveyId, question.questionId, respondent.id, repeat)
			.pipe(
				tap((response: SurveyResponseViewModel) => {
					this._storeResponse(question.questionId, respondent, response.responseValues);
				})
			);
	}
	/**
	 * Preloads / retrieves a set of responses in bulk and stores them for later access.
	 * @param questionIds A list of question IDs to load responses for.
	 * @param respondent  The respondent to load respones for
	 */
	public loadSavedResponses(questions: Array<SurveyViewQuestion>, respondent: SurveyRespondent): Observable<void> {
		let queryIds = [];
		for (let question of questions) {
			if (!this.hasStoredResponse(question, respondent)) {
				queryIds.push(question.questionId);
			}
		}
		// if there are no ids to query, return immediately
		if (queryIds.length === 0) {
			return EMPTY;
		}
		return new Observable((obs) => {
			this._responseClient
				.listSurveyResponsesForQuestions(this._session.surveyId, queryIds, respondent.id)
				.subscribe({
					next: (responses) => {
						// store each response
						for (let response of responses) {
							this._storeResponse(response.questionId, respondent, response.responseValues);
						}
					},
					complete: () => {
						obs.complete();
					},
				});
		});
	}

	/**
	 * Deletes all responses for the passed respondent.
	 * @param respondent
	 */
	public deleteAllResponses(respondent: SurveyRespondent): Observable<any> {
		return this._responseClient.deleteAllResponses(this._session.surveyId, respondent.id);
	}
}