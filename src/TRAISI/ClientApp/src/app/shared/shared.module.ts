import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ItemListComponent} from "./item-list/item-list.component";
import {SurveyService} from "../services/survey.service";
import {SurveyEndpointService} from "../services/survey-endpoint.service";
import {SearchBoxComponent} from "./search-box/search-box.component";
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [SurveyEndpointService,SurveyService],
  declarations: [ItemListComponent,SearchBoxComponent],
  exports: [ItemListComponent,SearchBoxComponent]
})
export class SharedModule { }
