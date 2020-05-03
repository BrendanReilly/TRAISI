import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, FormControlDirective, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { SurveyViewerEndpointFactory } from './services/survey-viewer-endpoint-factory.service';
import { AppRoutingModule } from './modules/routing/routing.module';
import { SurveyViewerContainerComponent } from './components/survey-viewer-container/survey-viewer-container.component';
import { SurveyViewerEndpointService } from './services/survey-viewer-endpoint.service';
import { SurveyErrorComponent } from './components/survey-error/survey-error.component';
import { SurveyStartPageComponent } from './components/survey-start-page/survey-start-page.component';
import { AppTranslationService, TranslateLanguageLoader } from '../../shared/services/app-translation.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { QuestionLoaderEndpointService } from './services/question-loader-endpoint.service';
import { QuestionContainerComponent } from './components/question-container/question-container.component';
import { QuestionPlaceholderComponent } from './components/question-placeholder/question-placeholder.component';
import { SurveyHeaderDisplayComponent } from './components/survey-header-display/survey-header-display.component';
import { SurveyTermsPageComponent } from './components/survey-terms-page/survey-terms-page.component';
import { SurveyViewerComponent } from './components/survey-viewer/survey-viewer.component';
import { QuestionLoaderService } from './services/question-loader.service';
import { SurveyViewerService } from './services/survey-viewer.service';
import { SurveyResponderEndpointService } from './services/survey-responder-endpoint.service';
import { SurveyResponderService } from './services/survey-responder.service';
import 'jquery';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { AlertModule } from 'ngx-bootstrap/alert';
import { SurveyViewerTranslateLanguageLoader } from './services/survey-viewer-translation.service';
import { ConfigurationService } from '../../shared/services/configuration.service';
import { LocalStoreManager } from '../../shared/services/local-store-manager.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ModalModule, ModalBackdropComponent, BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { QuillModule } from 'ngx-quill';
import { DynamicModule } from 'ng-dynamic-component';
import { SpecialPageBuilderComponent } from './components/special-page-builder/special-page-builder.component';
import { Header1Component } from './components/special-page-builder/header1/header1.component';
import { Header2Component } from './components/special-page-builder/header2/header2.component';
import { MainSurveyAccess1Component } from './components/special-page-builder/main-survey-access1/main-survey-access1.component';
import { TextBlock1Component } from './components/special-page-builder/text-block1/text-block1.component';
import { Footer1Component } from './components/special-page-builder/footer1/footer1.component';
import { PrivacyConfirmationComponent } from './components/special-page-builder/privacy-confirmation/privacy-confirmation.component';
import { SurveyViewerStateService } from './services/survey-viewer-state.service';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ConditionalEvaluator } from './services/conditional-evaluator/conditional-evaluator.service';
import { AdminToolbarComponent } from './components/admin-toolbar/admin-toolbar.component';
import { SurveyThankYouPageComponent } from './components/survey-thankyou-page/survey-thankyou-page.component';
import { SurveyGroupcodePageComponent } from './components/survey-groupcode-page/survey-groupcode-page.component';
import { SurveyScreeningPageComponent } from './components/survey-screening-page/survey-screening-page.component';
import { SurveyShortcodePageComponent } from './components/survey-shortcode-page/survey-shortcode-page.component';
import { SurveyShortcodeDisplayPageComponent } from './components/survey-shortcode-display-page/survey-shortcode-display-page.component';
import { SurveyViewerSession } from './services/survey-viewer-session.service';
import { SurveyViewerApiEndpointService } from './services/survey-viewer-api-endpoint.service';
import { httpInterceptorProviders } from './http-interceptors';
import { SurveyNavigationModule } from './modules/survey-navigation/survey-navigation.module';
import { SurveyViewerAuthorizationModule } from './modules/authorization/survey-viewer-authorization.module';
import { SurveyInternalViewDirective } from './directives/survey-internal-view/survey-internal-view.directive';
import { Saml2AuthorizationComponent } from './modules/authorization/saml2/saml2-authorization.component';
import { SurveyDataResolver } from './resolvers/survey-data.resolver';
import { SurveyTextTransformer } from './services/survey-text-transform/survey-text-transformer.service';
import { AuthInterceptor } from './http-interceptors/auth-interceptor';
import { ToastrModule } from 'ngx-toastr';
import { PipesModule } from '../../shared/pipes/pipes.module';
import { QuestionConfigurationService } from './services/question-configuration.service';
import { QuestionConfigurationService as Config } from 'traisi-question-sdk';
import { SurveyViewerResponseService } from './services/survey-viewer-response.service';
import { SurveyViewerRespondentService } from './services/survey-viewer-respondent.service';
@NgModule({
	entryComponents: [ModalBackdropComponent],
	declarations: [
		AppComponent,
		SurveyViewerContainerComponent,
		SurveyErrorComponent,
		SurveyStartPageComponent,
		QuestionContainerComponent,
		QuestionPlaceholderComponent,
		SurveyHeaderDisplayComponent,
		SurveyTermsPageComponent,
		SurveyViewerComponent,
		SurveyShortcodeDisplayPageComponent,
		SpecialPageBuilderComponent,
		PrivacyConfirmationComponent,
		Header1Component,
		Header2Component,
		SurveyInternalViewDirective,
		Saml2AuthorizationComponent,
		SurveyScreeningPageComponent,
		MainSurveyAccess1Component,
		TextBlock1Component,
		AdminToolbarComponent,
		SurveyThankYouPageComponent,
		// SurveyQuestionViewDirective,
		SurveyGroupcodePageComponent,
		SurveyShortcodePageComponent,
		Footer1Component,
	],
	imports: [
		BrowserModule,
		CommonModule,
		RouterModule,
		PipesModule,
		HttpClientModule,
		BrowserAnimationsModule,
		FormsModule,
		ModalModule.forRoot(),
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useClass: SurveyViewerTranslateLanguageLoader,
			},
		}),
		ReactiveFormsModule,
		AppRoutingModule.forRoot(),
		BsDatepickerModule.forRoot(),
		AlertModule.forRoot(),
		PopoverModule.forRoot(),
		QuillModule.forRoot(),
		DynamicModule,
		TooltipModule.forRoot(),
		TimepickerModule.forRoot(),
		SurveyNavigationModule.forRoot(),
		SurveyViewerAuthorizationModule,
		ToastrModule.forRoot(),
	],
	providers: [
		LocalStoreManager,
		SurveyViewerEndpointFactory,
		QuestionLoaderEndpointService,
		AppTranslationService,
		SurveyViewerService,
		{ provide: 'SurveyViewerService', useExisting: SurveyViewerService },
		{ provide: 'SurveyViewerApiEndpointService', useClass: SurveyViewerApiEndpointService },
		SurveyViewerEndpointService,
		ConfigurationService,
		QuestionLoaderService,
		ConditionalEvaluator,
		SurveyResponderService,
		SurveyViewerRespondentService,
		SurveyViewerResponseService,
		{ provide: 'SurveyResponseService', useExisting: SurveyViewerResponseService},
		{ provide: 'SurveyRespondentService', useExisting: SurveyViewerRespondentService },
		SurveyViewerStateService,
		FormControlDirective,
		FormGroupDirective,
		SurveyViewerSession,
		httpInterceptorProviders,
		SurveyResponderEndpointService,
		BsModalRef,
		{ provide: 'QuestionLoaderService', useClass: QuestionLoaderService },
		{ provide: 'CONFIG_SERVICE', useExisting: QuestionConfigurationService },
		{ provide: Config, useExisting: QuestionConfigurationService },
		SurveyDataResolver,
		SurveyTextTransformer,

		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptor,
			multi: true,
		},
		SurveyViewerResponseService,
		SurveyViewerResponseService,

		// SurveyDataResolver
	],
	bootstrap: [SurveyViewerContainerComponent],
})
export class AppModule {}