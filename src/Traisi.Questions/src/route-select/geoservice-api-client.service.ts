/* tslint:disable */
/* eslint-disable */
//----------------------
// <auto-generated>
//     Generated using the NSwag toolchain v13.7.0.0 (NJsonSchema v10.1.24.0 (Newtonsoft.Json v12.0.0.0)) (http://NSwag.org)
// </auto-generated>
//----------------------
// ReSharper disable InconsistentNaming

import { mergeMap as _observableMergeMap, catchError as _observableCatch } from 'rxjs/operators';
import { Observable, throwError as _observableThrow, of as _observableOf } from 'rxjs';
import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpResponseBase } from '@angular/common/http';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

@Injectable({
    providedIn: 'root'
})
export class GeoServiceClient {
    private http: HttpClient;
    private baseUrl: string;
    protected jsonParseReviver: ((key: string, value: any) => any) | undefined = undefined;

    constructor(@Inject(HttpClient) http: HttpClient, @Optional() @Inject(API_BASE_URL) baseUrl?: string) {
        this.http = http;
        this.baseUrl = baseUrl ? baseUrl : "";
    }

    reverseGeocode(lat: number, lng: number): Observable<IGeocodeResult> {
        let url_ = this.baseUrl + "/api/GeoService/reversegeo/{lat}/{lng}";
        if (lat === undefined || lat === null)
            throw new Error("The parameter 'lat' must be defined.");
        url_ = url_.replace("{lat}", encodeURIComponent("" + lat));
        if (lng === undefined || lng === null)
            throw new Error("The parameter 'lng' must be defined.");
        url_ = url_.replace("{lng}", encodeURIComponent("" + lng));
        url_ = url_.replace(/[?&]$/, "");

        let options_ : any = {
            observe: "response",
            responseType: "blob",
            headers: new HttpHeaders({
                "Accept": "application/json"
            })
        };

        return this.http.request("get", url_, options_).pipe(_observableMergeMap((response_ : any) => {
            return this.processReverseGeocode(response_);
        })).pipe(_observableCatch((response_: any) => {
            if (response_ instanceof HttpResponseBase) {
                try {
                    return this.processReverseGeocode(<any>response_);
                } catch (e) {
                    return <Observable<IGeocodeResult>><any>_observableThrow(e);
                }
            } else
                return <Observable<IGeocodeResult>><any>_observableThrow(response_);
        }));
    }

    protected processReverseGeocode(response: HttpResponseBase): Observable<IGeocodeResult> {
        const status = response.status;
        const responseBlob =
            response instanceof HttpResponse ? response.body :
            (<any>response).error instanceof Blob ? (<any>response).error : undefined;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }}
        if (status === 200) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            let result200: any = null;
            result200 = _responseText === "" ? null : <IGeocodeResult>JSON.parse(_responseText, this.jsonParseReviver);
            return _observableOf(result200);
            }));
        } else if (status !== 200 && status !== 204) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("An unexpected server error occurred.", status, _responseText, _headers);
            }));
        }
        return _observableOf<IGeocodeResult>(<any>null);
    }

    distanceMatrix(origins: string[] | null | undefined, destinations: string[] | null | undefined): Observable<FileResponse> {
        let url_ = this.baseUrl + "/api/GeoService/distancematrix?";
        if (origins !== undefined && origins !== null)
            origins && origins.forEach(item => { url_ += "origins=" + encodeURIComponent("" + item) + "&"; });
        if (destinations !== undefined && destinations !== null)
            destinations && destinations.forEach(item => { url_ += "destinations=" + encodeURIComponent("" + item) + "&"; });
        url_ = url_.replace(/[?&]$/, "");

        let options_ : any = {
            observe: "response",
            responseType: "blob",
            headers: new HttpHeaders({
                "Accept": "application/octet-stream"
            })
        };

        return this.http.request("get", url_, options_).pipe(_observableMergeMap((response_ : any) => {
            return this.processDistanceMatrix(response_);
        })).pipe(_observableCatch((response_: any) => {
            if (response_ instanceof HttpResponseBase) {
                try {
                    return this.processDistanceMatrix(<any>response_);
                } catch (e) {
                    return <Observable<FileResponse>><any>_observableThrow(e);
                }
            } else
                return <Observable<FileResponse>><any>_observableThrow(response_);
        }));
    }

    protected processDistanceMatrix(response: HttpResponseBase): Observable<FileResponse> {
        const status = response.status;
        const responseBlob =
            response instanceof HttpResponse ? response.body :
            (<any>response).error instanceof Blob ? (<any>response).error : undefined;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }}
        if (status === 200 || status === 206) {
            const contentDisposition = response.headers ? response.headers.get("content-disposition") : undefined;
            const fileNameMatch = contentDisposition ? /filename="?([^"]*?)"?(;|$)/g.exec(contentDisposition) : undefined;
            const fileName = fileNameMatch && fileNameMatch.length > 1 ? fileNameMatch[1] : undefined;
            return _observableOf({ fileName: fileName, data: <any>responseBlob, status: status, headers: _headers });
        } else if (status !== 200 && status !== 204) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("An unexpected server error occurred.", status, _responseText, _headers);
            }));
        }
        return _observableOf<FileResponse>(<any>null);
    }

    routePlanner(arrivalLat: number, arrivalLng: number, departureLat: number, departureLng: number, date: Date, mode: string | null, transitModes: string | null | undefined, accessibiliy: string | null | undefined): Observable<FileResponse> {
        let url_ = this.baseUrl + "/api/GeoService/routeplanner?";
        if (arrivalLat === undefined || arrivalLat === null)
            throw new Error("The parameter 'arrivalLat' must be defined and cannot be null.");
        else
            url_ += "arrivalLat=" + encodeURIComponent("" + arrivalLat) + "&";
        if (arrivalLng === undefined || arrivalLng === null)
            throw new Error("The parameter 'arrivalLng' must be defined and cannot be null.");
        else
            url_ += "arrivalLng=" + encodeURIComponent("" + arrivalLng) + "&";
        if (departureLat === undefined || departureLat === null)
            throw new Error("The parameter 'departureLat' must be defined and cannot be null.");
        else
            url_ += "departureLat=" + encodeURIComponent("" + departureLat) + "&";
        if (departureLng === undefined || departureLng === null)
            throw new Error("The parameter 'departureLng' must be defined and cannot be null.");
        else
            url_ += "departureLng=" + encodeURIComponent("" + departureLng) + "&";
        if (date === undefined || date === null)
            throw new Error("The parameter 'date' must be defined and cannot be null.");
        else
            url_ += "date=" + encodeURIComponent(date ? "" + date.toJSON() : "") + "&";
        if (mode === undefined)
            throw new Error("The parameter 'mode' must be defined.");
        else if(mode !== null)
            url_ += "mode=" + encodeURIComponent("" + mode) + "&";
        if (transitModes !== undefined && transitModes !== null)
            url_ += "transitModes=" + encodeURIComponent("" + transitModes) + "&";
        if (accessibiliy !== undefined && accessibiliy !== null)
            url_ += "accessibiliy=" + encodeURIComponent("" + accessibiliy) + "&";
        url_ = url_.replace(/[?&]$/, "");

        let options_ : any = {
            observe: "response",
            responseType: "blob",
            headers: new HttpHeaders({
                "Accept": "application/octet-stream"
            })
        };

        return this.http.request("get", url_, options_).pipe(_observableMergeMap((response_ : any) => {
            return this.processRoutePlanner(response_);
        })).pipe(_observableCatch((response_: any) => {
            if (response_ instanceof HttpResponseBase) {
                try {
                    return this.processRoutePlanner(<any>response_);
                } catch (e) {
                    return <Observable<FileResponse>><any>_observableThrow(e);
                }
            } else
                return <Observable<FileResponse>><any>_observableThrow(response_);
        }));
    }

    protected processRoutePlanner(response: HttpResponseBase): Observable<FileResponse> {
        const status = response.status;
        const responseBlob =
            response instanceof HttpResponse ? response.body :
            (<any>response).error instanceof Blob ? (<any>response).error : undefined;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }}
        if (status === 200 || status === 206) {
            const contentDisposition = response.headers ? response.headers.get("content-disposition") : undefined;
            const fileNameMatch = contentDisposition ? /filename="?([^"]*?)"?(;|$)/g.exec(contentDisposition) : undefined;
            const fileName = fileNameMatch && fileNameMatch.length > 1 ? fileNameMatch[1] : undefined;
            return _observableOf({ fileName: fileName, data: <any>responseBlob, status: status, headers: _headers });
        } else if (status !== 200 && status !== 204) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("An unexpected server error occurred.", status, _responseText, _headers);
            }));
        }
        return _observableOf<FileResponse>(<any>null);
    }
}

export interface IGeocodeResult {
    latitude?: number;
    longitude?: number;
    address?: Address | undefined;
}

export interface Address {
    postalCode?: string | undefined;
    streetAddress?: string | undefined;
    streetNumber?: number;
    city?: string | undefined;
    province?: string | undefined;
}

export interface FileResponse {
    data: Blob;
    status: number;
    fileName?: string;
    headers?: { [name: string]: any };
}

export class ApiException extends Error {
    message: string;
    status: number;
    response: string;
    headers: { [key: string]: any; };
    result: any;

    constructor(message: string, status: number, response: string, headers: { [key: string]: any; }, result: any) {
        super();

        this.message = message;
        this.status = status;
        this.response = response;
        this.headers = headers;
        this.result = result;
    }

    protected isApiException = true;

    static isApiException(obj: any): obj is ApiException {
        return obj.isApiException === true;
    }
}

function throwException(message: string, status: number, response: string, headers: { [key: string]: any; }, result?: any): Observable<any> {
    if (result !== null && result !== undefined)
        return _observableThrow(result);
    else
        return _observableThrow(new ApiException(message, status, response, headers, null));
}

function blobToText(blob: any): Observable<string> {
    return new Observable<string>((observer: any) => {
        if (!blob) {
            observer.next("");
            observer.complete();
        } else {
            let reader = new FileReader();
            reader.onload = event => {
                observer.next((<any>event.target).result);
                observer.complete();
            };
            reader.readAsText(blob);
        }
    });
}