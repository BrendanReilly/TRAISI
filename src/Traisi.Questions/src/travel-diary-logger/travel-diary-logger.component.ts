import {
	Component,
	AfterViewInit,
	ElementRef,
	Inject,
	OnInit,
	TemplateRef,
	ViewChild,
	ComponentFactoryResolver,
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import templateString from './travel-diary-logger.component.html';
import styleString from './travel-diary-logger.component.scss';
import { MapMouseEvent, Marker, LngLat } from 'mapbox-gl';
import * as mapboxgl from 'mapbox-gl';
import * as MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { MapComponent } from 'ngx-mapbox-gl';
import { Result } from 'ngx-mapbox-gl/lib/control/geocoder-control.directive';
import { concat, Observable, of, ReplaySubject, Subject, timer } from 'rxjs';
import * as mode from '../resources/traveldiary-modes.json';
import * as purpose from '../resources/mapquestion-purpose.json';

import {
	SurveyQuestion,
	ResponseTypes,
	QuestionConfiguration,
	SurveyViewer,
	OnSurveyQuestionInit,
	OnVisibilityChanged,
	OnSaveResponseStatus,
	StringResponseData,
	OnOptionsLoaded,
	QuestionOption,
	ResponseValidationState,
	ResponseData,
	OptionSelectResponseData,
	LocationResponseData,
	QuestionConfigurationService,
	TraisiValues,
	Address,
} from 'traisi-question-sdk';
import { BsDatepickerConfig, BsDatepickerDirective } from 'ngx-bootstrap/datepicker';
import { LocationLookupComponent } from 'shared/components/location-lookup.component';
import markerPng from '../map-question/marker.png';
import { GeoServiceClient, MapLocation } from '../shared/geoservice-api-client.service';
import { GeoLocation } from '../map-question/models/geo-location.model';
import { MapEndpointService } from '../map-question/services/mapservice.service';
import { MapQuestionConfiguration } from '../map-question/models/map-question-configuration.model';
import { moment } from 'ngx-bootstrap/chronos/test/chain';
import { countReset } from 'console';
import { HttpClient } from '@angular/common/http';

@Component({
	selector: 'traisi-travel-diary-logger',
	template: '' + templateString,
	entryComponents: [],
	styles: ['' + styleString],
})
export class TravelDiaryLoggerComponent extends SurveyQuestion<ResponseTypes.String> implements OnInit {
	modalRef: BsModalRef;

	public locationSearch: string;
	public locationLoaded: boolean = false;

	/**
	 * Purpose  of map question component
	 */
	public purpose: string = '';

	public preferredHeight = 350;

	public tripData: any[] = [];

	//data range (min/max) for the test data set
	minDate = '2017-10-01';
	maxDate = '2017-12-31';

	//dataTime range (min/max) for DepartureTime test data set
	minDateTime = '2017-10-01T12:00:00';
	maxDateTime = '2017-12-31T12:00:00';

	@ViewChild('dateInput', { static: true })
	public dateInput: BsDatepickerDirective;

	public dateData: Date;
	public selectedDate: any = '2017-10-27';

	public travelModeData: any = [];
	public travelPurposeData: any = [];
	public serverData: any = [];

	bsInlineValue = new Date();
	bsInlineRangeValue: Date[];

	public mapInstance: ReplaySubject<mapboxgl.Map>;
	protected accessToken: string;
	public loadGeocoder: boolean = true;

	public isAllItemsValid: boolean = true;

	/**
	 * Creates an instance of map question component.
	 * @param mapEndpointService
	 * @param cdRef
	 * @param surveyViewerService
	 */

	constructor(
		@Inject('SurveyViewerService') private surveyViewerService: SurveyViewer,
		@Inject('location.accesstoken') private _accessToken: string,
		@Inject(TraisiValues.Configuration) private _configuration: MapQuestionConfiguration,
		private httpObj: HttpClient
	) {
		super();
		this.surveyViewerService.configurationData.subscribe(this.loadConfigurationData);
		this.mapInstance = new ReplaySubject<mapboxgl.Map>(1);
		this._configuration.AccessToken = _accessToken;
		this.accessToken = _accessToken;
		this.travelModeData = mode.default;
		this.travelPurposeData = purpose.default;
	}

	/**
	 * on init
	 */
	public ngOnInit(): void {
		//coordinates
		let strDate: string = '2017-10-27';
		//userId should be taken from the logged in user
		let userId = '8ebd1ad8-d64d-4eba-80f9-6cac5c04af04';
		//map
		let url = '/api/TravelLogger/GetTripSourceData/' + userId;
		this.httpObj.get(url).subscribe((resData: any[]) => {
			this.serverData = resData;
			let coordinates: any[] = this.getCords('2017-10-27', this.serverData);
			//map
			var centerLong: any = coordinates[0][0][0];
			var centerLat: any = coordinates[0][0][1];
			this.generateMap(coordinates, centerLong, centerLat);
		});
	}

	//using test data at the moment
	public getCords(strDate: string, sourceData): any[] {
		//For now change the date here, to display routes loaded into the map
		sourceData = sourceData.filter((item) => item['tracked_at'].substring(0, 10) == strDate);
		var i = 0;
		//coordinates array
		var cordArray: any[] = [];
		//Trip table
		var tripTable: any[] = [];

		var tripId: number = 1;
		while (i < sourceData.length) {
			//trip array
			var tripArray: any[] = [];
			while (true) {
				var ar: any[] = [];
				ar.push(sourceData[i].longitude);
				ar.push(sourceData[i].latitude);
				tripArray.push(ar);

				if (sourceData[i]['status'] == 'Stop') {
					var tripObj: any = {};
					tripObj['Departure Time'] = sourceData[i]['tracked_at'];
					tripObj.Mode = sourceData[i].mode;
					tripObj.Purpose = sourceData[i].purpose;
					tripObj.Longitude = sourceData[i].longitude;
					tripObj.Latitude = sourceData[i].latitude;
					tripObj.isDataValid = false;
					tripTable.push(tripObj);
					i++;
					break;
				}
				i++;
			}
			cordArray.push(tripArray);
		}
		this.tripData = tripTable;
		return cordArray;
	}

	public gotoTripOnMap(index: number): void {
		let coordinates: any[] = this.getCords(this.selectedDate, this.serverData);
		var centerLong: any = this.tripData[index].Longitude;
		var centerLat: any = this.tripData[index].Latitude;
		this.generateMap(coordinates, centerLong, centerLat);
	}

	//Map
	public generateMap(coordinates: any[], centerLong: any, centerLat: any): void {
		document.getElementById('map').innerHTML = '';
		//it's just the test data, getTripData() would call the backend in normal circumstances
		(mapboxgl as any).accessToken = this.accessToken;

		var map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v11',
			center: [centerLong, centerLat],
			zoom: 15,
		});

		map.on('load', function () {
			//Line colors
			var ar: string[] = [
				'Red',
				'Green',
				'Blue',
				'Purple',
				'Orange',
				'Indigo',
				'Yellow',
				'Violet',
				'Turquoise',
				'Pink',
				'Teal',
				'Burgundy',
				'Maroon',
				'Brown',
				'Magenta',
			];
			//Looping
			for (let i = 0; i < coordinates.length; i++) {
				var routeId = 'route' + i;
				map.addSource(routeId, {
					type: 'geojson',
					data: {
						type: 'Feature',
						properties: {
							title: 'Trip' + (i + 1),
						},
						geometry: {
							type: 'LineString',
							coordinates: coordinates[i],
						},
					},
				});
				map.addLayer({
					id: 'route' + i,
					type: 'line',
					source: routeId,
					layout: {
						'line-join': 'round',
						'line-cap': 'round',
					},
					paint: {
						'line-color': ar[i],
						'line-width': 5,
					},
				});
				map.addLayer({
					id: 'symbols' + i,
					type: 'symbol',
					source: routeId,
					layout: {
						'symbol-placement': 'line',
						'text-font': ['Open Sans Regular'],
						'text-field': '{title}',
						'text-size': 16,
					},
				});
			}
		});
	}

	public traisiOnInit(): void {}

	public onConfirmClick(index: number): void {
		this.tripData[index].isDataValid = true;
		let invalidItems: any[] = this.tripData.filter((item) => item.isDataValid == false);

		if (invalidItems.length <= 0) {
			this.isAllItemsValid = false;
			this.validationState.emit(ResponseValidationState.VALID);
		}
	}

	public loadConfigurationData(data: QuestionConfiguration[]): void {}

	//Select a date from the calendar
	public updateTripDate() {
		let coordinates: any[] = this.getCords(this.selectedDate, this.serverData);
		if (coordinates.length <= 0) {
			document.getElementById('map').innerHTML = '';
			return;
		}
		var centerLong: any = coordinates[0][0][0];
		var centerLat: any = coordinates[0][0][1];
		this.generateMap(coordinates, centerLong, centerLat);
	}
}
