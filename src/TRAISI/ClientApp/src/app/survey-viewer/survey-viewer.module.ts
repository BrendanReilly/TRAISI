import { NgModule, SystemJsNgModuleLoader } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionLoaderService } from './services/question-loader.service';
import { QuestionLoaderEndpointService } from './services/question-loader-endpoint.service';
import { ROUTES } from './survey-viewer.routes';
import { SharedModule } from '../shared/shared.module';
import { SurveyViewerComponent } from './components/survey-viewer/survey-viewer.component';
import { SurveyViewerService } from './services/survey-viewer.service';
import { SurveyViewerEndpointService } from './services/survey-viewer-endpoint.service';
import { SurveyWelcomePageComponent } from './components/survey-welcome-page/survey-welcome-page.component';
import { SurveyTermsPageComponent } from './components/survey-terms-page/survey-terms-page.component';
import { SurveyCompletePageComponent } from './components/survey-complete-page/survey-complete-page.component';
import { SurveyViewerContainerComponent } from './components/survey-viewer-container/survey-viewer-container.component';

@NgModule({
	imports: [CommonModule, SharedModule, ROUTES],
	declarations: [
		SurveyViewerComponent,
		SurveyWelcomePageComponent,
		SurveyTermsPageComponent,
		SurveyCompletePageComponent,
		SurveyViewerContainerComponent
	],
	providers: [
		QuestionLoaderEndpointService,
		QuestionLoaderService,
		SurveyViewerService,
		SurveyViewerEndpointService
	],
	exports: []
})
export class SurveyViewerModule {}
