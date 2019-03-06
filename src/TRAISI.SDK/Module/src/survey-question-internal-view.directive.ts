import { ResponseValidationState } from './question-response-state';
import { EventEmitter, Output, Inject, ChangeDetectorRef, Component, Directive } from '@angular/core';
import { QuestionConfiguration } from './question-configuration';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

@Directive({
	selector: '[traisiQuestionInternalView]',
	exportAs: 'traisiSurveyQuestionInternalView'
})
export class SurveyQuestionInternalViewDirective { }
