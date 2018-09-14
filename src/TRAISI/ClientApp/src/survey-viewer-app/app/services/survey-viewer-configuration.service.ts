import {Injectable} from '@angular/core';
import {LocalStoreManager} from '../../../shared/services/local-store-manager.service';
import {AppTranslationService} from '../../../shared/services/app-translation.service';
import {SurveyViewerTranslationService} from './survey-viewer-translation.service';
import {Configuration} from 'jasmine-spec-reporter/built/configuration';
import {ConfigurationService} from '../../../shared/services/configuration.service';
import {DBkeys} from '../../../shared/services/db-keys';

@Injectable({providedIn: 'root'})
export class SurveyViewerConfigurationService {


	private _language: string = null;

	/**
	 *
	 * @param localStorage
	 * @param translationService
	 */
	constructor(private localStorage: LocalStoreManager, private translationService: SurveyViewerTranslationService) {


	}

	/**
	 *
	 */
	private loadLocalChanges() {

		if (this.localStorage.exists(DBkeys.LANGUAGE)) {
			this._language = this.localStorage.getDataObject<string>(DBkeys.LANGUAGE);
			this.translationService.changeLanguage(this._language);
		}
		else {
			this.resetLanguage();
		}
	}

	/**
	 *
	 */
	private resetLanguage() {
		let language = this.translationService.useBrowserLanguage();

		if (language) {
			this._language = language;
		}
		else {
			this._language = this.translationService.changeLanguage();
		}
	}

}
