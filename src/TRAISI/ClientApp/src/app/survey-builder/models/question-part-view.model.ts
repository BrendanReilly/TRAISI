import { QuestionPartViewLabel } from './question-part-view-label.model';

export class QuestionPartView {
	constructor(
		public id?: number,
		public label?: string,
		public questionChildren?: QuestionPartView[],
		public order?: number
	) {}
}