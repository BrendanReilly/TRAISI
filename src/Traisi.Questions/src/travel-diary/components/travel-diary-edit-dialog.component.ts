import {
	SurveyQuestion,
	ResponseTypes,
	OnVisibilityChanged,
	TimelineResponseData,
	TraisiValues,
	SurveyRespondent,
} from 'traisi-question-sdk';
import {
	Component,
	ViewEncapsulation,
	Output,
	EventEmitter,
	ViewChild,
	TemplateRef,
	OnInit,
	Inject,
	ViewContainerRef,
	Injector,
	AfterViewInit,
	SkipSelf,
	ApplicationRef,
} from '@angular/core';
import templateString from './travel-diary-edit-dialog.component.html';
import styleString from './travel-diary-edit-dialog.component.scss';
import { TravelDiaryService } from '../services/travel-diary.service';
import { CalendarEvent, CalendarView, CalendarDayViewComponent } from 'angular-calendar';
import { BsModalRef, BsModalService, ModalDirective } from 'ngx-bootstrap/modal';
import { TravelDiaryConfiguration, TravelMode, Purpose } from '../models/travel-diary-configuration.model';
import { Subject, BehaviorSubject, Observable, concat, of } from 'rxjs';
import {
	DialogMode,
	SurveyRespondentUser,
	TimelineLineResponseDisplayData,
	TravelDiaryEvent,
} from 'travel-diary/models/consts';
import { NgForm } from '@angular/forms';
import { TravelDiaryEditor } from 'travel-diary/services/travel-diary-editor.service';
@Component({
	selector: 'traisi-travel-diary-edit-dialog',
	template: '' + templateString,
	encapsulation: ViewEncapsulation.None,
	providers: [],
	styles: ['' + styleString],
})
export class TravelDiaryEditDialogComponent implements AfterViewInit {
	@Output() public newEventSaved: EventEmitter<
		TimelineResponseData | { users: SurveyRespondentUser[] }
	> = new EventEmitter();
	@Output() public eventSaved: EventEmitter<
		TimelineResponseData | { users: SurveyRespondentUser[] }
	> = new EventEmitter();
	@Output() public eventDeleted: EventEmitter<
		TimelineResponseData | { users: SurveyRespondentUser[] }
	> = new EventEmitter();

	public modalRef: BsModalRef;

	private _mapComponent: any;

	@ViewChild('eventForm') eventForm: NgForm;

	@ViewChild('newEntryModal', { static: true })
	public modal: ModalDirective;

	@ViewChild('mapTemplate', { read: ViewContainerRef })
	public mapTemplate: ViewContainerRef;

	public searchInFocus: boolean = false;

	public model: TimelineLineResponseDisplayData;

	public dialogMode: DialogMode;

	public dialogModeEdit = DialogMode.Edit;

	public dialogModeNew = DialogMode.New;

	private _isMapLoaded = false;

	public isInsertedDepartureTime: boolean = false;

	public isRequiresEndTime: boolean = false;

	public isRequiresReturnHomeTime: boolean = false;

	public insertedIntoEvent: TravelDiaryEvent;

	public isFirstEventInDay: boolean = false;

	public isShowMemberSelect: boolean = true;

	private _respondentRef: SurveyRespondentUser;

	public get defaultDate(): Date {
		return this._surveyAccessTime;
	}

	/**
	 *Creates an instance of TravelDiaryEditDialogComponent.
	 * @param {BsModalService} _modalService
	 * @param {Injector} _injector
	 * @param {TravelDiaryService} _travelDiaryService
	 * @param {*} _questionLoaderService
	 */
	public constructor(
		private _modalService: BsModalService,
		private _injector: Injector,
		private _editorService: TravelDiaryEditor,
		private _travelDiaryService: TravelDiaryService,
		@Inject(TraisiValues.QuestionLoader) private _questionLoaderService,
		@Inject(TraisiValues.SurveyAccessTime) private _surveyAccessTime: Date,
		@Inject(TraisiValues.Respondent) private _respondent: SurveyRespondent,
		@Inject(TraisiValues.PrimaryRespondent) private _primaryRespondent: SurveyRespondent
	) {
		this.resetModel();
	}

	private resetModel(): void {
		this.isInsertedDepartureTime = false;
		this.insertedIntoEvent = null;
		this.isRequiresEndTime = false;
		this.isRequiresReturnHomeTime = false;
		let id = Date.now();
		let users = [];
		if (this._respondentRef) {
			users = [].concat(this._respondentRef);
		}

		this.model = {
			id: undefined,
			displayId: id,
			isValid: false,
			address: undefined,
			latitude: 0,
			longitude: 0,
			name: undefined,
			order: 1,
			purpose: undefined,
			timeA: new Date(this._surveyAccessTime),
			timeB: new Date(this._surveyAccessTime),
			users: users,
			displayAddress: undefined,
		};

		if (this.eventForm) {
			this.eventForm.resetForm();
		}

		if (this._mapComponent) {
			this._mapComponent.resetInput();
		}
		this._travelDiaryService.resetAddressQuery();
	}

	public eventInputChanges($event): void {
		// console.log(this.eventInputChanges);
	}

	public onMembersChanged($event: any) {
		this.checkTimeOverlaps();
	}

	public checkTimeOverlaps(): void {
		let insertedEvent = this._editorService.getOverlappingDeparture(
			this.model,
			this._travelDiaryService.diaryEvents$.value
		);

		if (this.dialogMode === DialogMode.Edit) {
			let laterEvent = this._editorService.getLaterEvent(this.model, this._travelDiaryService.diaryEvents$.value);

			if (laterEvent) {
				this.model.hasEndTime = true;
				this.isRequiresEndTime = true;
			} else {
				this.model.hasEndTime = false;
				this.isRequiresEndTime = false;
			}
		}
		if (insertedEvent) {
			this.insertedIntoEvent = insertedEvent;
			this.isInsertedDepartureTime = true;
			if (
				insertedEvent.meta.model.purpose.toLowerCase().includes('home') &&
				insertedEvent.meta.model.displayId !== this.model.displayId
			) {
				this.isRequiresReturnHomeTime = true;
				this.model.isReturnHomeSplit = true;
				this.model.hasEndTime = true;
				this.model.isInserted = true;
			}
		} else {
			this.isRequiresReturnHomeTime = false;
			this.model.isReturnHomeSplit = false;
			this.insertedIntoEvent = undefined;
			this.isInsertedDepartureTime = false;
		}
	}

	/**
	 *
	 * @param $event
	 */
	public onDepartureTimeChange($event: Date): void {
		if (!$event) {
			return;
		}
		$event.setDate(this.defaultDate.getDate());
		if ($event.getHours() < 4 && $event.getHours() >= 0) {
			// this needs to be adjusted
			$event.setDate($event.getDate() + 1);
		}

		this.model.timeA = $event;
		this.checkTimeOverlaps();
	}

	/**
	 *
	 * @param $event
	 */
	public onReturnTimeChange($event: Date): void {
		if (!$event) {
			return;
		}
		$event.setDate(this.defaultDate.getDate());
		if ($event.getHours() < 4 && $event.getHours() >= 0) {
			// this needs to be adjusted
			$event.setDate($event.getDate() + 1);
		}

		if ($event < this.model.timeA) {
			this.eventForm.form.controls['insertedEndTime'].setErrors({ invalid: true });
		} else {
			this.eventForm.form.controls['insertedEndTime'].setErrors(null);
		}
	}

	public onInsertionConfirm($event: any): void {}

	public dialogSave(): void {
		this.hide();
		if (this.dialogMode === DialogMode.New) {
			this.newEventSaved.emit(this.model);
		} else {
			this.eventSaved.emit(this.model);
		}
	}

	public hide(): void {
		this.modal.hide();
	}

	public delete(): void {
		this.eventDeleted.emit(this.model);
		this.modal.hide();
		this.resetModel();
	}

	/**
	 * Show a new model
	 *
	 */
	public show(mode: DialogMode, model?: TimelineLineResponseDisplayData): void {
		this.dialogMode = mode;

		if (mode === DialogMode.New) {
			this.resetModel();
			this.eventForm.form.markAsPristine();
			this.eventForm.form.markAsUntouched();
			this.eventForm.form.reset();
			this.eventForm.reset();
			this.model.users = [].concat(this._respondentRef);
		} else {
			this.eventForm.form.markAllAsTouched();
			this.eventForm.form.updateValueAndValidity();
			this.model = Object.assign({}, model);
		}

		this.isFirstEventInDay = this.model.order > 0 ? false : true;

		this.searchInFocus = false;
		this.modal.show();
		if (!this._isMapLoaded) {
			let componentRef = null;
			let factories = this._questionLoaderService.componentFactories;
			let sub = Object.keys(this._questionLoaderService.componentFactories).forEach((key) => {
				let factory = this._questionLoaderService.componentFactories[key];
				if (factory.selector === 'traisi-map-question') {
					componentRef = this.mapTemplate.createComponent(factory, undefined, this._injector);
					let instance: SurveyQuestion<any> = <SurveyQuestion<any>>componentRef.instance;
					instance.containerHeight = 300;
					instance['loadGeocoder'] = false;
					instance.response.subscribe((value) => {
						this.mapResonse(value);
					});
					this._mapComponent = instance;
					this._isMapLoaded = true;
				}
			});
		}
	}

	public searchFocus(): void {
		this.searchInFocus = true;
	}

	public searchBlur(): void {
		this.searchInFocus = false;
		if (this._mapComponent) {
			setTimeout(() => {
				this._mapComponent['resize']();
			}, 100);
		}
	}

	public get users(): any {
		return this._travelDiaryService.users;
	}

	public get purposes(): Purpose[] {
		return this._travelDiaryService.configuration.purpose;
	}

	public get addresses(): Observable<string[]> {
		return this._travelDiaryService.addresses$;
	}

	public get modes(): TravelMode[] {
		return this._travelDiaryService.configuration.mode;
	}

	public get addressInput(): Subject<string> {
		return this._travelDiaryService.addressInput$;
	}

	public locationChanged(event): void {
		let r = [event.center[0], event.center[1]];
		(<any>this._mapComponent).setMarkerLocation(r);
		(<any>this._mapComponent).flyToPosition(r);
		(<any>this._mapComponent).saveLocation({ lat: r[1], lng: r[0] });
	}

	public mapResonse(response): void {
		this.model.address = response['address'];
		this.model.latitude = response['latitude'];
		this.model.longitude = response['longitude'];
	}

	public ngAfterViewInit(): void {}
	public ngOnInit(): void {
		this._travelDiaryService.users.subscribe((x) => {
			let r = x.find((y) => y.id === this._respondent.id);
			if (r) {
				this._respondentRef = r;
			}
		});

		if (this._primaryRespondent.id === this._respondent.id) {
			this.isShowMemberSelect = true;
		} else {
			this.isShowMemberSelect = false;
		}
	}
}
