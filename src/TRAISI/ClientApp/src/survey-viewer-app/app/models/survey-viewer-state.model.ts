import { SurveyViewQuestion } from './survey-view-question.model';
import { SurveyViewPage } from './survey-view-page.model';
import { SurveyViewSection } from './survey-view-section.model';
import { SurveyViewGroupMember } from './survey-view-group-member.model';

export interface SurveyViewerState {
	surveyPages: Array<SurveyViewPage>;
	surveyQuestions: Array<SurveyViewQuestion>;
	activeQuestion: SurveyViewQuestion;
	activeSection: SurveyViewSection;
	activePage: SurveyViewPage;
	isSectionActive: boolean;
	activeQuestionIndex: number;
	activePageIndex: number;
	groupMembers: Array<SurveyViewGroupMember>;
}