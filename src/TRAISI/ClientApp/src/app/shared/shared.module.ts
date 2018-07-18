import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemListComponent } from './item-list/item-list.component';
import { SearchBoxComponent } from './search-box/search-box.component';
import { FormsModule } from '@angular/forms';
import { NullAstVisitor } from '@angular/compiler';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'ngx-bootstrap';

@NgModule({
	imports: [CommonModule, TooltipModule, FormsModule, RouterModule],
	providers: [],
	declarations: [ItemListComponent, SearchBoxComponent],
	exports: [ItemListComponent, SearchBoxComponent]
})
export class SharedModule {}
