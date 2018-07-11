import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { TranslateLanguageLoader } from '../services/app-translation.service';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { SafePipe } from '../pipes/safe.pipe';
import { GroupsManagementComponent } from './groups-management.component';
import { ROUTES } from './groups-management.routes';
import { ModalModule } from 'ngx-bootstrap';

import { MonacoEditorModule } from 'ngx-monaco-editor';

@NgModule({
	imports: [
		CommonModule,
		ROUTES,
		FormsModule,
		SharedModule,
		ModalModule,
		TranslateModule.forChild({
			loader: { provide: TranslateLoader, useClass: TranslateLanguageLoader }
		}),
		NgxDatatableModule,
		MonacoEditorModule
	],
	declarations: [GroupsManagementComponent, SafePipe]
})
export class GroupsManagementModule {}
