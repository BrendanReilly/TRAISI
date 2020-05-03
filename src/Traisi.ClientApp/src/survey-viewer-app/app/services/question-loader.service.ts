import {
	Compiler,
	Component,
	Injector,
	SkipSelf,
	ViewChild,
	ViewContainerRef,
	Injectable,
	ComponentFactory,
	NgModuleRef,
	ComponentRef,
	ElementRef,
	InjectionToken,
	Type,
	Inject
} from '@angular/core';
import { QuestionLoaderEndpointService } from './question-loader-endpoint.service';
import {
	Observable,
	of,
	Operator,
	Subscriber,
	Observer,
	ReplaySubject,
	from,
	EMPTY,
	forkJoin
} from 'rxjs';
import * as AngularCore from '@angular/core';
import * as AngularCommon from '@angular/common';
import * as AngularHttp from '@angular/common/http';
import * as AngularForms from '@angular/forms';
import * as Upgrade from '@angular/upgrade/static';
import * as popover from 'ngx-bootstrap/popover';
import * as alert from 'ngx-bootstrap/alert';
import * as buttons from 'ngx-bootstrap/buttons';
import * as modal from 'ngx-bootstrap/modal';
import * as dropdown from 'ngx-bootstrap/dropdown';
import * as carousel from 'ngx-bootstrap/carousel';
import * as datepicker from 'ngx-bootstrap/datepicker';
import * as BrowserModule from '@angular/platform-browser';
import * as tooltip from 'ngx-bootstrap/tooltip';
import * as timePicker from 'ngx-bootstrap/timepicker';
import * as rxjsSubject from 'rxjs/Subject';
import * as rxjsReplaySubject from 'rxjs/ReplaySubject';
import * as rxjsOperators from 'rxjs/operators';
import * as rxjs from 'rxjs';
import * as rxjsBehaviourSubject from 'rxjs/BehaviorSubject';
import * as rxjsObservable from 'rxjs/Observable';
import * as traisiSdkModule from 'traisi-question-sdk';
import * as angularPopper from 'angular-popper';
import { share, map, expand } from 'rxjs/operators';
import { find } from 'lodash';

import { SurveyViewQuestion as ISurveyQuestion } from '../models/survey-view-question.model';
import { UpgradeModule } from '@angular/upgrade/static';
import { SurveyQuestion, QuestionConfiguration } from 'traisi-question-sdk';
import { QuestionConfigurationService } from './question-configuration.service';

type ComponentFactoryBoundToModule<T> = any;

declare const SystemJS;

@Injectable({
	providedIn: 'root'
})
export class QuestionLoaderService {
	private _componentFactories: {
		[type: string]: ComponentFactoryBoundToModule<any>;
	} = {};

	public get componentFactories(): {
		[type: string]: ComponentFactoryBoundToModule<any>;
	} {
		of();
		return this._componentFactories;
	}

	private _moduleRefs: { [type: string]: NgModuleRef<any> } = {};

	private _loadedModules: Set<any> = new Set<any>();

	/**
	 *Creates an instance of QuestionLoaderService.
	 * @param {QuestionLoaderEndpointService} _questionLoaderEndpointService
	 * @param {Compiler} compiler
	 * @param {Injector} injector
	 * @memberof QuestionLoaderService
	 */
	constructor(
		private _questionLoaderEndpointService: QuestionLoaderEndpointService,
		@Inject('CONFIG_SERVICE')
		private _questionConfigurationService: QuestionConfigurationService,
		private compiler: Compiler,
		private injector: Injector
	) {
		SystemJS.config({ transpiler: false });
		this.init();
	}

	private init(): void {
		SystemJS.registry.set('@angular/core', SystemJS.newModule(AngularCore));
		SystemJS.registry.set(
			'@angular/common',
			SystemJS.newModule(AngularCommon)
		);
		SystemJS.registry.set(
			'@angular/common/http',
			SystemJS.newModule(AngularHttp)
		);
		SystemJS.registry.set(
			'@angular/forms',
			SystemJS.newModule(AngularForms)
		);
		SystemJS.registry.set(
			'@angular/platform-browser',
			SystemJS.newModule(BrowserModule)
		);
		SystemJS.registry.set(
			'@angular/upgrade/static',
			SystemJS.newModule(Upgrade)
		);
		SystemJS.registry.set(
			'@angular/upgrade',
			SystemJS.newModule(UpgradeModule)
		);
		SystemJS.registry.set(
			'ngx-bootstrap/popover',
			SystemJS.newModule(popover)
		);
		SystemJS.registry.set('ngx-bootstrap/alert', SystemJS.newModule(alert));
		SystemJS.registry.set(
			'ngx-bootstrap/datepicker',
			SystemJS.newModule(datepicker)
		);
		SystemJS.registry.set(
			'ngx-bootstrap/buttons',
			SystemJS.newModule(buttons)
		);
		SystemJS.registry.set('ngx-bootstrap/modal', SystemJS.newModule(modal));
		SystemJS.registry.set(
			'ngx-bootstrap/dropdown',
			SystemJS.newModule(dropdown)
		);
		SystemJS.registry.set(
			'ngx-bootstrap/carousel',
			SystemJS.newModule(carousel)
		);
		SystemJS.registry.set(
			'ngx-bootstrap/tooltip',
			SystemJS.newModule(tooltip)
		);
		SystemJS.registry.set(
			'ngx-bootstrap/timepicker',
			SystemJS.newModule(timePicker)
		);
		SystemJS.registry.set(
			'traisi-question-sdk',
			SystemJS.newModule(traisiSdkModule)
		);
		SystemJS.registry.set('rxjs/Subject', SystemJS.newModule(rxjsSubject));
		SystemJS.registry.set(
			'rxjs/BehaviorSubject',
			SystemJS.newModule(rxjsBehaviourSubject)
		);
		SystemJS.registry.set(
			'rxjs/internal/BehaviorSubject',
			SystemJS.newModule(rxjsBehaviourSubject)
		);
		SystemJS.registry.set(
			'rxjs/Observable',
			SystemJS.newModule(rxjsObservable)
		);
		SystemJS.registry.set(
			'rxjs/ReplaySubject',
			SystemJS.newModule(rxjsReplaySubject)
		);
		SystemJS.registry.set('rxjs', SystemJS.newModule(rxjs));
		SystemJS.registry.set(
			'angular-popper',
			SystemJS.newModule(angularPopper)
		);
		SystemJS.registry.set(
			'rxjs/operators',
			SystemJS.newModule(rxjsOperators)
		);
	}

	/**
	 *
	 */
	public getQuestionComponentModule(questionType: string): NgModuleRef<any> {
		return this._moduleRefs[questionType];
	}

	/**
	 *
	 *
	 * @param {string} questionType
	 * @returns {Observable<any>}
	 * @memberof QuestionLoaderService
	 */
	public getQuestionComponentFactory(
		questionType: string
	): Observable<ComponentFactoryBoundToModule<any>> {
		// reuse the preloaded component factory

		if (questionType in this._componentFactories) {
			return of(this._componentFactories[questionType]);
		}
		// if the module has already loaded.. but the question does not exist yet
		else if (questionType in this._moduleRefs) {
			return of(
				this.createComponentFactory(
					this._moduleRefs[questionType],
					questionType
				)
			).pipe(
				map((componentFactory: ComponentFactoryBoundToModule<any>) => {
					if (!(questionType in this._componentFactories)) {
						this._componentFactories[
							questionType
						] = componentFactory;
					}
					return componentFactory;
				})
			);
		} else {
			return from(
				SystemJS.import(
					this._questionLoaderEndpointService.getClientCodeEndpointUrl(
						questionType
					)
				)
			).pipe(
				map((module: any) => {
					if (module.default.name in this._moduleRefs) {
						return this._moduleRefs[module.default.name];
					}
					const moduleFactory = this.compiler.compileModuleAndAllComponentsSync(
						module.default
					);
					const moduleRef: any = moduleFactory.ngModuleFactory.create(
						this.injector
					);
					this._moduleRefs[<string>module.default.name] = moduleRef;
					return moduleRef;
				}),
				map((moduleRef: any) => {
					const componentFactory: ComponentFactoryBoundToModule<any> = <
						ComponentFactoryBoundToModule<any>
					>this.createComponentFactory(moduleRef, questionType);
					return componentFactory;
				}),
				expand(
					(componentFactory: ComponentFactoryBoundToModule<any>) => {
						if (!(questionType in this._componentFactories)) {
							this._componentFactories[
								questionType
							] = componentFactory;
						} else {
							return EMPTY;
						}
						let hasDependency: boolean = false;
						for (let key of Object.keys(
							componentFactory['ngModule']._providers
						)) {
							let provider =
								componentFactory['ngModule']._providers[key];
							if (
								provider !== undefined &&
								provider.hasOwnProperty('dependency')
							) {
								hasDependency = true;
								return this.getQuestionComponentFactory(
									provider.name
								);
							}
						}
						return of(componentFactory);
					}
				),
				share()
			);
		}
	}

	/**
	 *
	 * @param moduleRef
	 * @param questionType
	 */
	private createComponentFactory(
		moduleRef: NgModuleRef<any>,
		questionType: string
	): ComponentFactoryBoundToModule<any> {
		const widgets = moduleRef.injector.get<Array<any>>(<any>'widgets', []);

		// let cat = moduleRef.injector.get('test');
		const resolver = moduleRef.componentFactoryResolver;
		let widget = find(widgets[0], item => {
			return item.id.toLowerCase() === questionType.toLowerCase();
		});

		const componentFactory: ComponentFactoryBoundToModule<any> = <
			ComponentFactoryBoundToModule<any>
		>resolver.resolveComponentFactory(widget.component);

		if (!(questionType in this._componentFactories)) {
			// 	this._componentFactories[questionType] = componentFactory;
		}
		return componentFactory;
	}

	/**
	 *
	 * @param questionType
	 * @param viewContainerRef
	 */
	public loadQuestionComponent(
		question: ISurveyQuestion,
		viewContainerRef: ViewContainerRef
	): Observable<ComponentRef<any>> {
		return new Observable(o => {
			forkJoin([
				this.getQuestionComponentFactory(question.questionType),
				this._questionLoaderEndpointService.getQuestionConfigurationEndpoint(
					question.questionType
				)
			]).subscribe({
				next: ([componentFactory, configuration]) => {
					this._questionConfigurationService.setQuestionServerConfiguration(
						question,
						configuration
					);
				},
				complete: () => {
					let componentRef = viewContainerRef.createComponent(
						this._componentFactories[question.questionType],
						undefined,
						this.injector
					);
					o.next(componentRef);
					o.complete();
				}
			});
		});
	}

	/**
	 * Retrieves the server configuration (file) for the associated question type.
	 * @param question
	 */
	public getQuestionConfiguration(
		question: ISurveyQuestion
	): Observable<any> {
		return this._questionLoaderEndpointService.getQuestionConfigurationEndpoint(
			question.questionType
		);
	}
}