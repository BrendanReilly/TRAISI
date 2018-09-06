import { Injectable } from '@angular/core';
import { SurveyBuilderEndpointService } from './survey-builder-endpoint.service';
import { Observable } from 'rxjs';
import { QuestionTypeDefinition } from '../models/question-type-definition';
import { UploadPath } from '../models/upload-path';
import { WelcomePage } from '../models/welcome-page.model';
import { TermsAndConditionsPage } from '../models/terms-and-conditions-page.model';
import { ThankYouPage } from '../models/thank-you-page.model';
import { SurveyViewStructure } from '../models/survey-view-structure.model';
import { QuestionPartView } from '../models/question-part-view.model';
import { Order } from '../models/order.model';
import { QuestionConfigurationValue } from '../models/question-configuration-value.model';
import { map } from 'rxjs/operators';
import { QuestionOptionValue } from '../models/question-option-value.model';
import { QuestionConditional } from '../models/question-conditional.model';
import { QuestionOptionConditional } from '../models/question-option-conditional.model';
import { SurveyQuestionOptionStructure } from '../models/survey-question-option-structure.model';
import { TreeviewItem, TreeItem } from 'ngx-treeview';

@Injectable()
export class SurveyBuilderService {
	constructor(private surveyBuilderEndpointService: SurveyBuilderEndpointService) {}

	/**
	 * Returns a list of question types that are available on the server.
	 */
	public getQuestionTypes(): Observable<QuestionTypeDefinition[]> {
		return this.surveyBuilderEndpointService.getQuestionTypesEndpoint<QuestionTypeDefinition[]>();
	}

	public deleteUploadedFile(filePath: UploadPath) {
		return this.surveyBuilderEndpointService.getDeleteUploadedFileEndopint<UploadPath>(filePath);
	}

	public getStandardWelcomePage(surveyId: number, language: string): Observable<WelcomePage> {
		return this.surveyBuilderEndpointService.getStandardWelcomePageEndpoint<WelcomePage>(surveyId, language);
	}

	public getStandardTermsAndConditionsPage(surveyId: number, language: string): Observable<TermsAndConditionsPage> {
		return this.surveyBuilderEndpointService.getStandardTermsAndConditionsPageEndpoint<TermsAndConditionsPage>(
			surveyId,
			language
		);
	}

	public getStandardThankYouPage(surveyId: number, language: string): Observable<ThankYouPage> {
		return this.surveyBuilderEndpointService.getStandardThankYouPageEndpoint<ThankYouPage>(surveyId, language);
	}

	public updateStandardWelcomePage(surveyId: number, welcomePage: WelcomePage) {
		return this.surveyBuilderEndpointService.getUpdateStandardWelcomePageEndpoint<WelcomePage>(
			surveyId,
			welcomePage
		);
	}

	public updateStandardTermsAndConditionsPage(surveyId: number, tAndCPage: TermsAndConditionsPage) {
		return this.surveyBuilderEndpointService.getUpdateStandardTermsAndConditionsPageEndpoint<
			TermsAndConditionsPage
		>(surveyId, tAndCPage);
	}

	public updateStandardThankYouPage(surveyId: number, thankYouPage: ThankYouPage) {
		return this.surveyBuilderEndpointService.getUpdateStandardThankYouPageEndpoint<ThankYouPage>(
			surveyId,
			thankYouPage
		);
	}

	public getStandardViewPageStructure(surveyId: number, language: string): Observable<SurveyViewStructure> {
		return this.surveyBuilderEndpointService.getStandardViewPageStructureEndpoint<SurveyViewStructure>(
			surveyId,
			language
		);
	}

	public getStandardViewPagesStructureWithQuestionsOptions(
		surveyId: number,
		language: string
	): Observable<TreeviewItem[]> {
		return this.surveyBuilderEndpointService
			.getStandardViewPagesStructureWithQuestionsOptionsEndpoint<SurveyQuestionOptionStructure[]>(
				surveyId,
				language
			)
			.pipe(
				map(items => {
					return this.convertSurveyQuestionsStructureToTreeItems(items, 'Page');
				})
			);
	}

	private convertSurveyQuestionsStructureToTreeItems(items: SurveyQuestionOptionStructure[], level: string): TreeviewItem[] {
		if (items !== null) {
			let tree: TreeviewItem[] = items.map(item => {
				let prefix = `: ${item.label}`;
				if (item.type === 'part') {
					prefix = level + prefix;
				} else if (item.type === 'question') {
					prefix = 'Question' + prefix;
				} else {
					prefix = 'Option' + prefix;
				}
				let treeItem: TreeItem = {
					text: `${prefix}`,
					value: `${item.type}-${item.id}`,
					children: this.convertSurveyQuestionsStructureToTreeItems(item.children, 'Part'),
					checked: false
				};
				return new TreeviewItem(treeItem);
			});
			return tree;
		} else {
			return null;
		}
	}

	public updateStandardViewPageOrder(surveyId: number, pageOrder: Order[]) {
		return this.surveyBuilderEndpointService.getUpdateStandardViewPageOrderEndpoint<Order[]>(surveyId, pageOrder);
	}

	public addStandardPage(surveyId: number, language: string, pageInfo: QuestionPartView) {
		return this.surveyBuilderEndpointService.getAddStandardPageEndpoint<QuestionPartView>(
			surveyId,
			language,
			pageInfo
		);
	}

	public deleteStandardPage(surveyId: number, pageId: number) {
		return this.surveyBuilderEndpointService.getDeleteStandardPageEndpoint<number>(surveyId, pageId);
	}

	public getQuestionPartViewPageStructure(
		surveyId: number,
		questionPartViewId: number,
		language: string
	): Observable<QuestionPartView> {
		return this.surveyBuilderEndpointService.getQuestionPartViewPageStructureEndpoint<QuestionPartView>(
			surveyId,
			questionPartViewId,
			language
		);
	}

	public updateQuestionPartViewOrderEndpoint(
		surveyId: number,
		questionPartViewId: number,
		childrenViewOrder: Order[]
	) {
		return this.surveyBuilderEndpointService.getUpdateQuestionPartViewOrderEndpoint<Order[]>(
			surveyId,
			questionPartViewId,
			childrenViewOrder
		);
	}

	public addQuestionPartView(
		surveyId: number,
		questionPartViewId: number,
		language: string,
		newPart: QuestionPartView
	) {
		return this.surveyBuilderEndpointService.getAddQuestionPartViewEndpoint<QuestionPartView>(
			surveyId,
			questionPartViewId,
			language,
			newPart
		);
	}

	public deleteQuestionPartView(surveyId: number, questionPartViewId: number, childQuestionPartViewId: number) {
		return this.surveyBuilderEndpointService.getDeleteQuestionPartViewEndpoint<number>(
			surveyId,
			questionPartViewId,
			childQuestionPartViewId
		);
	}

	public updateQuestionPartViewData(surveyId: number, updatedInfo: QuestionPartView) {
		return this.surveyBuilderEndpointService.getUpdateQuestionPartViewDataEndpoint<QuestionPartView>(
			surveyId,
			updatedInfo
		);
	}

	public getQuestionPartConfigurations(surveyId: number, questionPartId: number): Observable<Map<string, string>> {
		return this.surveyBuilderEndpointService
			.getQuestionPartConfigurationsEndpoint<QuestionConfigurationValue[]>(surveyId, questionPartId)
			.pipe(
				map(configValuesArray => {
					let configValuesMap: Map<string, string> = new Map<string, string>();
					if (configValuesArray !== null) {
						configValuesArray.forEach(configValue => {
							configValuesMap.set(configValue.name, configValue.value);
						});
					}
					return configValuesMap;
				})
			);
	}

	public updateQuestionPartConfigurations(
		surveyId: number,
		questionPartId: number,
		updatedConfigurations: QuestionConfigurationValue[]
	) {
		return this.surveyBuilderEndpointService.getUpdateQuestionPartConfigurationsEndpoint<
			QuestionConfigurationValue[]
		>(surveyId, questionPartId, updatedConfigurations);
	}

	public getQuestionPartOptions(surveyId: number, questionPartId: number, language: string) {
		return this.surveyBuilderEndpointService.getQuestionPartOptionsEndpoint<QuestionOptionValue[]>(
			surveyId,
			questionPartId,
			language
		);
	}

	public getQuestionPartConditionals(surveyId: number, questionPartId): Observable<QuestionConditional[]> {
		return this.surveyBuilderEndpointService.getQuestionPartConditionalsEndpoint<QuestionConditional[]>(
			surveyId,
			questionPartId
		);
	}

	public getQuestionPartOptionConditionals(
		surveyId: number,
		questionPartId
	): Observable<QuestionOptionConditional[]> {
		return this.surveyBuilderEndpointService.getQuestionPartOptionConditionalsEndpoint<QuestionOptionConditional[]>(
			surveyId,
			questionPartId
		);
	}

	public setQuestionPartOption(
		surveyId: number,
		questionPartId: number,
		optionInfo: QuestionOptionValue
	): Observable<QuestionOptionValue> {
		return this.surveyBuilderEndpointService.getSetQuestionPartOptionEndpoint<QuestionOptionValue>(
			surveyId,
			questionPartId,
			optionInfo
		);
	}

	public setQuestionPartConditionals(surveyId: number, questionPartId: number, conditionals: QuestionConditional[]) {
		return this.surveyBuilderEndpointService.getSetQuestionPartConditionalsEndpoint<QuestionConditional[]>(
			surveyId,
			questionPartId,
			conditionals
		);
	}

	public setQuestionPartOptionConditionals(
		surveyId: number,
		questionPartId: number,
		conditionals: QuestionOptionConditional[]
	) {
		return this.surveyBuilderEndpointService.getSetQuestionPartOptionConditionalsEndpoint<
			QuestionOptionConditional[]
		>(surveyId, questionPartId, conditionals);
	}

	public deleteQuestionPartOption(surveyId: number, questionPartId: number, optionId: number) {
		return this.surveyBuilderEndpointService.getDeleteQuestionPartOptionEndpoint<number>(
			surveyId,
			questionPartId,
			optionId
		);
	}

	public updateQuestionPartOptionsOrder(surveyId: number, questionPartId: number, updatedOrder: Order[]) {
		return this.surveyBuilderEndpointService.getUpdateQuestionPartOptionsOrderEndpoint<Order[]>(
			surveyId,
			questionPartId,
			updatedOrder
		);
	}
}