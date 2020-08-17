import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TravelDiaryQuestionComponent } from './travel-diary-question.component';
import {
	CalendarModule,
	DateAdapter,
	CalendarCommonModule,
	CalendarDayModule,
	CalendarTooltipWindowComponent,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { FlatpickrModule } from 'angularx-flatpickr';
import { FormsModule } from '@angular/forms';
import { TravelDiaryEditDialogComponent } from './travel-diary-edit-dialog.component';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';
import { NgSelectModule } from '@ng-select/ng-select';
import { DayViewSchedulerComponent } from './day-view-scheduler.component';

export const calendarProps = {
	provide: DateAdapter,
	useFactory: adapterFactory,
};
export const calModule: ModuleWithProviders = CalendarModule.forRoot(calendarProps);

@NgModule({
	declarations: [TravelDiaryQuestionComponent, TravelDiaryEditDialogComponent, DayViewSchedulerComponent],
	entryComponents: [TravelDiaryQuestionComponent, TravelDiaryEditDialogComponent, DayViewSchedulerComponent],
	providers: [
		{
			provide: 'widgets',
			useValue: [
				{
					name: 'traisi-travel-diary-question',
					id: 'travel-diary',
					component: TravelDiaryQuestionComponent,
				},
				{
					name: 'traisi-travel-diary-edit-dialog',
					id: 'travel-diary-edit-dialog',
					component: TravelDiaryEditDialogComponent,
        },
        {
					name: 'traisi-travel-dairy-day-view-scheduler',
					id: 'travel-diary-scheduler',
					component: DayViewSchedulerComponent,
				},
			],
			multi: true,
		},
	],
	imports: [
		CommonModule,
		FormsModule,
		HttpClientModule,
		ModalModule.forRoot(),
		FlatpickrModule.forRoot(),
		CalendarModule.forRoot(calendarProps),
		CalendarCommonModule.forRoot(calendarProps),
		CalendarDayModule,
		NgSelectModule,
	],
	exports: [CalendarDayModule, CalendarModule, CalendarCommonModule],
})
export default class TravelDiaryQuestionModule {
	static forRoot(): ModuleWithProviders<TravelDiaryQuestionComponent> {
		return {
			ngModule: TravelDiaryQuestionComponent,
			providers: [],
		};
	}
}