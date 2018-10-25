import { Component, OnInit, Input, ElementRef, ViewChild, AfterViewInit, ViewChildren, QueryList, ViewEncapsulation, ChangeDetectorRef, HostListener } from '@angular/core';
import { Utilities } from '../../../../../shared/services/utilities';
import { QuestionPart } from '../../models/question-part.model';
import { QuestionTypeDefinition } from '../../models/question-type-definition';
import { QuestionOptionDefinition } from '../../models/question-option-definition.model';
import { SurveyBuilderService } from '../../services/survey-builder.service';
import { QuestionOptionValue } from '../../models/question-option-value.model';
import { QuestionOptionLabel } from '../../models/question-option-label.model';
import { AlertService, DialogType, MessageSeverity } from '../../../../../shared/services/alert.service';
import { Order } from '../../models/order.model';
import { DropzoneConfigInterface, DropzoneComponent } from 'ngx-dropzone-wrapper';
import { AuthService } from '../../../../../shared/services';
import { ConfigurationService } from '../../../../../shared/services/configuration.service';
import { DownloadNotification } from '../../../models/download-notification';
import { Subject } from 'rxjs';
import { RealTimeNotificationServce } from '../../../services/real-time-notification.service';

@Component({
	selector: 'app-question-details',
	templateUrl: './question-details.component.html',
	styleUrls: ['./question-details.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class QuestionDetailsComponent implements OnInit, AfterViewInit {
	private baseUrl: string = '';

	public items: Map<string, QuestionOptionValue[]> = new Map<string, QuestionOptionValue[]>();
	public itemsCache: Map<string, QuestionOptionValue[]> = new Map<string, QuestionOptionValue[]>();
	public searchValue: string[] = [];

	public pendingOptions: QuestionOptionValue[] = [];
	public savedItems: Map<number, string> = new Map<number, string>();

	public addingOption: boolean = false;
	public reordering: boolean = true;

	public questionOptionDefinitions: QuestionOptionDefinition[] = [];

	private downloadProgress: DownloadNotification = null;
	private downloadNotifier: Subject<DownloadNotification>;

	public dropZoneconfig: DropzoneConfigInterface = {
		// Change this to your upload POST address:
		maxFilesize: 50,
		maxFiles: 1,
		acceptedFiles: '.csv',
		autoReset: 2000,
		errorReset: 2000,
		cancelReset: 2000,
		timeout: 3000000
	};

	public numberPerPage: number = 10;
	public maxSize: number = 10;
	public optionPage: number[] = [];

	@Input()
	public surveyId: number;
	@Input()
	public question: QuestionPart;
	@Input()
	public language: string;
	@Input()
	public qTypeDefinitions: Map<string, QuestionTypeDefinition> = new Map<string, QuestionTypeDefinition>();

	@ViewChildren('newOptionKey')
	public newOptionKeys: QueryList<ElementRef>;
	@ViewChildren('optionUpload')
	public optionUploads: QueryList<DropzoneComponent>;

	constructor(
		private builderService: SurveyBuilderService,
		private alertService: AlertService,
		private authService: AuthService,
		private configurationService: ConfigurationService,
		private notificationService: RealTimeNotificationServce,
		private cdRef: ChangeDetectorRef
	) {
		this.baseUrl = configurationService.baseUrl;
		this.getOptionPayload = this.getOptionPayload.bind(this);
	}

	@HostListener('touchmove', ['$event'])
  public onTouchMove(e: MouseEvent) {
		e.preventDefault();
	}


	public ngOnInit(): void {

		let qOptions = this.qTypeDefinitions.get(this.question.questionType).questionOptions;
		Object.keys(qOptions).forEach(q => {
			this.questionOptionDefinitions.push(qOptions[q]);
			this.searchValue.push('');
			this.items.set(q, []);
			this.itemsCache.set(q, []);
			this.optionPage.push(1);
		});

		this.loadOptionData();
		this.dropZoneconfig.url = `${this.baseUrl}/api/SurveyBuilder/${this.surveyId}/QuestionOptions/${this.question.id}/massImport`;
		this.dropZoneconfig.headers = {
			Authorization: 'Bearer ' + this.authService.accessToken
		};
	}

	private loadOptionData(): void {
		this.items.clear();
		this.itemsCache.clear();
		this.savedItems.clear();

		let qOptions = this.qTypeDefinitions.get(this.question.questionType).questionOptions;
		Object.keys(qOptions).forEach(q => {
			this.items.set(q, []);
			this.itemsCache.set(q, []);
		});

		this.builderService.getQuestionPartOptions(this.surveyId, this.question.id, this.language).subscribe(
			options => {
				if (options !== null) {
					options.forEach(option => {
						this.itemsCache.get(option.name).push(option);
						this.items.get(option.name).push(option);
						this.savedItems.set(option.id, `${option.code}|${option.optionLabel.value}`);
					});
				}
				this.reordering = false;
			},
			error => {
				this.reordering = false;
			}
		);
	}

	public ngAfterViewInit(): void {
		// this.optionUploads.changes.subscribe(changed => {
		  let i = 0;
			this.optionUploads.forEach(dzone => {
				let name = this.questionOptionDefinitions[i++].name;
				dzone.DZ_SENDING.subscribe(data => this.onSendingOptions(data, name));
			});
		// });
	}

	public onSearchChanged(value: string, optionName: string, index: number): void {
		this.searchValue[index] = value;
		let optionItems = this.itemsCache.get(optionName);
		let filtered = optionItems.filter(r => Utilities.searchArray(value, false, r.code, r.optionLabel.value));
		this.items.set(optionName, filtered);
		this.optionPage[index] = 1;
		this.cdRef.detectChanges();
	}

	public onArrowRight(event: KeyboardEvent, element: HTMLInputElement): void {
		let nextInput: HTMLInputElement;

		if (element.selectionEnd === element.value.length) {
			event.preventDefault();
			try {
				nextInput = element.nextElementSibling as HTMLInputElement;

				nextInput.focus();
				nextInput.selectionStart = 0;
				nextInput.selectionEnd = 0;
			} catch {}
		}
	}

	private onSendingOptions(data: any, name: string): void {
		this.alertService.startLoadingMessage('Uploading options...');

		let optionInfo = new QuestionOptionValue(
			0,
			'upload',
			name,
			new QuestionOptionLabel(0, 'upload', this.language),
			0
		);
		data[2].append('parameters', JSON.stringify(optionInfo));
	}

	public onUploadSuccess(event: any): void {
		this.alertService.stopLoadingMessage();
		if (event[1] === 'success') {
			this.alertService.showMessage('Success', 'Successfully imported options', MessageSeverity.success);
			setTimeout(() => {
				this.loadOptionData();
				this.notificationService.indicateSurveyChange(this.surveyId);
			}, 1000);
		} else {
			this.alertService.showMessage('Partial Success', 'Successfully imported some options. Error list downloading...', MessageSeverity.warn);
			let result = event[1];
			this.downloadProgress = new DownloadNotification('', 1);
			this.downloadProgress.id = result;
			this.downloadProgress.progress = 25;
			this.downloadNotifier = this.notificationService.registerChannel<DownloadNotification>(result);
			this.downloadNotifier.subscribe(
				update => {
					this.downloadSuccessHelper(update);
					setTimeout(() => {
						this.loadOptionData();
					}, 1000);
				},
				error => {
					// this.downloadIndicator = false;
					this.downloadNotifier.unsubscribe();
					this.alertService.stopLoadingMessage();
				}
			);
		}

	}

	private downloadSuccessHelper(update: DownloadNotification): void {
		this.downloadProgress = update;
		if (update.progress === 100) {
			// this.alertService.stopLoadingMessage();
			// this.downloadIndicator = false;
			// download file and unsubscribe
			window.open(this.downloadProgress.url, '_self');
			this.downloadNotifier.unsubscribe();
			this.notificationService.deRegisterChannel(this.downloadProgress.id);
		}
	}

	public onUploadError(error: any): void {
		this.alertService.stopLoadingMessage();
		this.alertService.showStickyMessage(
			'Generation Error',
			`An error occured whilst importing the options.\r\nError: "${Utilities.getHttpResponseMessage(
				this.processDZError(error[1])
			)}"`,
			MessageSeverity.error
		);
	}

	private processDZError(errors: any): string {
		if (Array.isArray(errors)) {
			let errorString: string = '';
			for (const error of errors['']) {
				errorString += error + '\n';
			}
			return errorString;
		} else {
			return errors;
		}
	}

	public onArrowLeft(event: KeyboardEvent, element: HTMLInputElement): void {
		let previousInput: HTMLInputElement;

		if (element.selectionStart === 0) {
			event.preventDefault();
			try {
				previousInput = element.previousElementSibling as HTMLInputElement;

				previousInput.focus();
				previousInput.selectionStart = previousInput.selectionEnd = previousInput.value.length;
				previousInput.selectionEnd = previousInput.selectionEnd = previousInput.value.length;
			} catch {}
		}
	}

	public onArrowDown(
		event: KeyboardEvent,
		element: HTMLInputElement,
		elementNum: number,
		optionIndex: number,
		addNewIfAtEnd?: boolean,
		newName?: string
	): void {
		let nextInput: HTMLInputElement;

		if (element.selectionEnd === element.value.length || addNewIfAtEnd) {
			event.preventDefault();

			try {
				nextInput = element.parentElement.parentElement.parentElement.nextElementSibling.firstElementChild
					.firstElementChild.firstElementChild as HTMLInputElement;

				for (let i = 0; i < elementNum; i++) {
					nextInput = nextInput.nextElementSibling as HTMLInputElement;
				}
				nextInput.focus();
				nextInput.selectionStart = 0;
				nextInput.selectionEnd = 0;
			} catch {
				if (addNewIfAtEnd && !this.pendingOptions[optionIndex]) {
					this.addOption(newName, optionIndex);
					setTimeout(() => {
						this.newOptionKeys.toArray()[optionIndex].nativeElement.focus();
					}, 0);
				} else if (this.newOptionKeys.toArray()[optionIndex]) {
					this.newOptionKeys.toArray()[optionIndex].nativeElement.focus();
				}
			}
		}
	}

	public onArrowUp(event: KeyboardEvent, element: HTMLInputElement, elementNum: number): void {
		let previousInput: HTMLInputElement;

		if (element.selectionStart === 0) {
			event.preventDefault();
			try {
				previousInput = element.parentElement.parentElement.parentElement.previousElementSibling
					.firstElementChild.firstElementChild.firstElementChild as HTMLInputElement;

				for (let i = 0; i < elementNum; i++) {
					previousInput = previousInput.nextElementSibling as HTMLInputElement;
				}
				previousInput.focus();
				previousInput.selectionStart = previousInput.value.length;
				previousInput.selectionEnd = previousInput.value.length;
			} catch {}
		}
	}

	public onEnter(event: KeyboardEvent, item: QuestionOptionValue, element: HTMLInputElement, index: number): void {
		this.onArrowDown(event, element, 0, index, true, item.name);
	}

	public getOptionPayload(index: number): any {
		return this.items[index];
	}

	public onDrop(dropResult: any, optionName: string): void {
		this.reordering = true;
		let optionList = this.itemsCache.get(optionName);
		optionList = Utilities.applyDrag(optionList, dropResult);
		this.itemsCache.set(optionName, optionList);
		this.items.set(optionName, optionList);
		this.updateQuestionOrder(optionList);
		let newOrder: Order[] = optionList.map(ap => new Order(ap.id, ap.order));
		this.builderService.updateQuestionPartOptionsOrder(this.surveyId, this.question.id, newOrder).subscribe(
			result => {
				this.reordering = false;
				this.notificationService.indicateSurveyChange(this.surveyId);
			},
			error => {
				this.reordering = false;
			}
		);
	}

	public optionChanged(item: QuestionOptionValue): boolean {
		return this.savedItems.get(item.id) !== `${item.code}|${item.optionLabel.value}`;
	}

	public updateQuestionOrder(options: QuestionOptionValue[]): void {
		options.forEach((q, index) => (q.order = index));
	}

	public savePendingOption(index: number, activeInputElement?: number): void {
		this.builderService.setQuestionPartOption(this.surveyId, this.question.id, this.pendingOptions[index]).subscribe(
			addedOption => {
				this.notificationService.indicateSurveyChange(this.surveyId);
				let optionName = this.pendingOptions[index].name;
				this.items.get(optionName).push(addedOption);
				this.itemsCache.get(optionName).push(addedOption);
				this.savedItems.set(addedOption.id, `${addedOption.code}|${addedOption.optionLabel.value}`);
				this.pendingOptions[index] = undefined;

				if (activeInputElement !== undefined && this.items.get(optionName).length < this.numberPerPage) {
					let smoothDndWrapper: Element = this.newOptionKeys.toArray()[index].nativeElement.parentElement.parentElement
						.previousElementSibling;

					setTimeout(() => {
						let newlyAdded: HTMLInputElement = smoothDndWrapper.firstElementChild.lastElementChild
							.firstElementChild.firstElementChild.children[activeInputElement] as HTMLInputElement;
						newlyAdded.focus();
					}, 0);
				}

				// this.addingOption = false;
			},
			error => {
				this.alertService.showMessage(
					'Error',
					`Problem saving option!\r\nErrors: "${Utilities.getHttpResponseMessage(error)}"`,
					MessageSeverity.error
				);
			}
		);
	}

	public pendingOptionValid(index: number): boolean {
		return this.pendingOptions[index].code !== '' && this.pendingOptions[index].optionLabel.value !== '';
	}

	public deletePendingOption(index: number): void {
		this.pendingOptions[index] = undefined;
	}

	public addOption(optionDefName: string, index: number): void {
		// this.addingOption = true;
		let optionOrder = this.itemsCache.get(optionDefName).length;
		this.pendingOptions[index] = new QuestionOptionValue(
			0,
			'',
			optionDefName,
			new QuestionOptionLabel(0, '', this.language),
			optionOrder
		);
	}

	public deleteOption(optionDefName: string, optionGroupIndex: number, order: number): void {
		this.alertService.showDialog('Are you sure you want to delete this option?', DialogType.confirm, () => {
			let optionList = this.itemsCache.get(optionDefName);
			this.builderService
				.deleteQuestionPartOption(this.surveyId, this.question.id, optionList[order].id)
				.subscribe(success => {
					let deleted = optionList.splice(order, 1);
					this.savedItems.delete(deleted[0].id);
					this.updateQuestionOrder(optionList);
					this.onSearchChanged(this.searchValue[optionGroupIndex], optionDefName, optionGroupIndex);
				});
		});
	}

	public saveOption(option: QuestionOptionValue): void {
		this.builderService.setQuestionPartOption(this.surveyId, this.question.id, option).subscribe(
			result => {
				this.savedItems.set(option.id, `${option.code}|${option.optionLabel.value}`);
				this.notificationService.indicateSurveyChange(this.surveyId);
			},
			error => {
				this.alertService.showMessage(
					'Error',
					`Problem saving option!\r\nErrors: "${Utilities.getHttpResponseMessage(error)}"`,
					MessageSeverity.error
				);
			}
		);
	}
}
