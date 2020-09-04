import { NavigationState } from 'app/models/navigation-state.model';
import { ViewTransformer } from '../services/survey-navigator/view-transformer.service';
import { QuestionInstance } from 'app/models/question-instance.model';

export abstract class ViewTransformation {
	public viewTransformer: ViewTransformer;
	public abstract transformNavigationState(state: NavigationState, questionInstances: QuestionInstance[]): QuestionInstance[];
}
